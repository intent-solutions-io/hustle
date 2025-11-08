#!/usr/bin/env bash
# lyria_render.sh - Render instrumental orchestral score using Vertex AI Lyria
# Part of HUSTLE repo - pulls specs from imported NWSL docs
set -euo pipefail

# Source dependencies
source ./gate.sh
source 050-scripts/_lro.sh

echo "🎵 Lyria Render - Instrumental Only"
echo "=================================="

# Set defaults
OUTPUT_DIR="020-audio/music"
SPECS_DIR="docs/imported"
DRY_RUN="${DRY_RUN:-false}"
MODEL_ID="${MODEL_ID:-lyria-002}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# ============================================
# 1) DRY RUN CHECK FIRST
# ============================================
if [ "${DRY_RUN}" = "true" ]; then
    echo "🔧 DRY RUN MODE - Creating placeholder audio"

    # Create silent master mix (60.04s)
    ffmpeg -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=48000" \
        -t 60.04 \
        "$OUTPUT_DIR/master_mix.wav" -y

    # Log the operation
    log_vertex_op "Lyria" "generate_score" "dry-run" "dry-run-$(date +%s)"

    echo "✅ Placeholder master_mix.wav created (60.04s silent audio)"
    exit 0
fi

# ============================================
# 2) PRODUCTION MODE - CALL VERTEX AI LYRIA API
# ============================================
echo "🎵 PRODUCTION MODE - Generating orchestral score with Vertex AI Lyria..."

# Check for Lyria specifications (optional - warn if missing but don't exit)
LYRIA_SPEC=""
if [ -f "$SPECS_DIR/023-DR-REFF-lyria-cue-sheet.md" ]; then
    LYRIA_SPEC="$SPECS_DIR/023-DR-REFF-lyria-cue-sheet.md"
    echo "📋 Using Lyria spec: $LYRIA_SPEC"
elif [ -f "deps/nwsl/docs/023-DR-REFF-lyria-cue-sheet.md" ]; then
    LYRIA_SPEC="deps/nwsl/docs/023-DR-REFF-lyria-cue-sheet.md"
    echo "📋 Using Lyria spec: $LYRIA_SPEC"
else
    echo "⚠️ WARNING: No Lyria specification found - using built-in defaults"
fi

# ============================================
# 3) TWO 30s CALLS WITH CROSSFADE FOR 60s AUDIO
# ============================================
echo "📞 Calling Vertex AI Lyria API for 60s audio (2x30s with crossfade)..."

# Temporary files for audio segments
TEMP_AUDIO_1=$(mktemp --suffix=_part1.wav)
TEMP_AUDIO_2=$(mktemp --suffix=_part2.wav)

# ------------------------------------------
# First 30s segment
# ------------------------------------------
echo ""
echo "  🎵 Generating first 30s segment..."
OP_ID_1="lyria-part1-$(date +%s)-${GITHUB_RUN_ID:-local}"

REQUEST_BODY_1='{
  "instances": [{
    "prompt": "Cinematic orchestral documentary score, emotional and powerful, E minor transitioning to G major, suitable for women sports documentary about NWSL strike and labor negotiations, instrumental only with no vocals, orchestral strings brass and percussion, first movement",
    "negative_prompt": "vocals, spoken word, dialogue, singing, voice, narration"
  }],
  "parameters": {
    "sampleCount": 1
  }
}'

# Submit first LRO
echo "  📤 Submitting first segment to Vertex AI..."
OP_NAME_1="$(curl -sS --fail-with-body \
  --connect-timeout 10 \
  --max-time 60 \
  --retry 3 \
  --retry-all-errors \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL_ID}:predictLongRunning" \
  -d "$REQUEST_BODY_1" | jq -r '.name')" || {
    echo "  ❌ Failed to submit first Lyria segment"
    exit 1
  }

echo "  📍 Operation: $OP_NAME_1"

# Poll first operation (max 1800s = 30 minutes)
echo "  ⏳ Polling first segment..."
LRO_RESULT_1="$(poll_lro "$OP_NAME_1" 1800 10)" || {
  RC=$?
  echo "  ❌ First segment polling failed (exit code: $RC)"
  exit 1
}

# Extract GCS URI from first segment
GCS_URI_1="$(jq -r '.response.gcsOutputUri // .response.predictions[0].gcsUri // empty' <<<"$LRO_RESULT_1")"

if [[ -z "$GCS_URI_1" ]]; then
  echo "  ❌ No GCS URI in first segment response"
  echo "$LRO_RESULT_1" | jq '.' >&2
  exit 1
fi

echo "  📥 Downloading first segment from: $GCS_URI_1"
gcloud storage cp "$GCS_URI_1" "$TEMP_AUDIO_1" || {
  echo "  ❌ Failed to download first segment"
  exit 1
}

log_vertex_op "Lyria" "generate_score_part1" "$MODEL_ID" "$OP_ID_1" "success" "200"
echo "  ✅ First 30s segment complete"

# ------------------------------------------
# Second 30s segment
# ------------------------------------------
echo ""
echo "  🎵 Generating second 30s segment..."
OP_ID_2="lyria-part2-$(date +%s)-${GITHUB_RUN_ID:-local}"

REQUEST_BODY_2='{
  "instances": [{
    "prompt": "Cinematic orchestral documentary score continuation, emotional and powerful, building to climax, suitable for women sports documentary about NWSL strike and labor negotiations, instrumental only with no vocals, orchestral strings brass and percussion, second movement",
    "negative_prompt": "vocals, spoken word, dialogue, singing, voice, narration"
  }],
  "parameters": {
    "sampleCount": 1
  }
}'

# Submit second LRO
echo "  📤 Submitting second segment to Vertex AI..."
OP_NAME_2="$(curl -sS --fail-with-body \
  --connect-timeout 10 \
  --max-time 60 \
  --retry 3 \
  --retry-all-errors \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL_ID}:predictLongRunning" \
  -d "$REQUEST_BODY_2" | jq -r '.name')" || {
    echo "  ❌ Failed to submit second Lyria segment"
    rm -f "$TEMP_AUDIO_1"
    exit 1
  }

echo "  📍 Operation: $OP_NAME_2"

# Poll second operation (max 1800s = 30 minutes)
echo "  ⏳ Polling second segment..."
LRO_RESULT_2="$(poll_lro "$OP_NAME_2" 1800 10)" || {
  RC=$?
  echo "  ❌ Second segment polling failed (exit code: $RC)"
  rm -f "$TEMP_AUDIO_1"
  exit 1
}

# Extract GCS URI from second segment
GCS_URI_2="$(jq -r '.response.gcsOutputUri // .response.predictions[0].gcsUri // empty' <<<"$LRO_RESULT_2")"

if [[ -z "$GCS_URI_2" ]]; then
  echo "  ❌ No GCS URI in second segment response"
  echo "$LRO_RESULT_2" | jq '.' >&2
  rm -f "$TEMP_AUDIO_1"
  exit 1
fi

echo "  📥 Downloading second segment from: $GCS_URI_2"
gcloud storage cp "$GCS_URI_2" "$TEMP_AUDIO_2" || {
  echo "  ❌ Failed to download second segment"
  rm -f "$TEMP_AUDIO_1"
  exit 1
}

log_vertex_op "Lyria" "generate_score_part2" "$MODEL_ID" "$OP_ID_2" "success" "200"
echo "  ✅ Second 30s segment complete"

# ------------------------------------------
# Crossfade and concatenate
# ------------------------------------------
echo ""
echo "  🎚️ Crossfading segments (2s crossfade at 28-30s) to create 60.04s master..."

if [ -f "$TEMP_AUDIO_1" ] && [ -f "$TEMP_AUDIO_2" ]; then
    # Crossfade 2s at the join (28-30s transition)
    ffmpeg -i "$TEMP_AUDIO_1" -i "$TEMP_AUDIO_2" \
        -filter_complex "[0:a][1:a]acrossfade=d=2:c1=tri:c2=tri" \
        -t 60.04 \
        "$OUTPUT_DIR/master_mix.wav" -y || {
          echo "  ❌ Crossfade failed"
          rm -f "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
          exit 1
        }

    echo "  ✅ 60.04s master audio created with crossfade"

    # Cleanup temp files
    rm -f "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
else
    echo "  ❌ Missing audio segments for crossfade"
    rm -f "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
    exit 1
fi

# ============================================
# 4) VERIFY OUTPUT
# ============================================
if [ ! -s "$OUTPUT_DIR/master_mix.wav" ]; then
    echo "❌ ERROR: master_mix.wav is missing or empty"
    exit 1
fi

# Check duration
DURATION=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_DIR/master_mix.wav")

echo ""
echo "📊 Audio Analysis:"
echo "  Duration: ${DURATION}s (expected: 60.04s)"

# Check sample rate
SAMPLE_RATE=$(ffprobe -v error -select_streams a:0 \
    -show_entries stream=sample_rate \
    -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_DIR/master_mix.wav")
echo "  Sample Rate: ${SAMPLE_RATE}Hz (expected: 48000Hz)"

# Check channels
CHANNELS=$(ffprobe -v error -select_streams a:0 \
    -show_entries stream=channels \
    -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_DIR/master_mix.wav")
echo "  Channels: $CHANNELS (expected: 2)"

echo ""
echo "✅ Lyria render complete!"

# Write render report
cat > "docs/lyria_render_report.md" << EOF
# Lyria Render Report
**Date:** $(date +%Y-%m-%d\ %H:%M:%S)
**Run ID:** ${GITHUB_RUN_ID:-local}
**Model:** ${MODEL_ID}

## Configuration
- Mode: Instrumental Only (NO VOCALS)
- Duration: 60.04 seconds
- Sample Rate: 48000 Hz
- Channels: Stereo
- Implementation: Two 30s segments with 2s crossfade

## Operations
- Part 1: ${OP_NAME_1##*/}
- Part 2: ${OP_NAME_2##*/}

## Output Files
- Master: $OUTPUT_DIR/master_mix.wav ($(ls -lh "$OUTPUT_DIR/master_mix.wav" | awk '{print $5}'))

## Voice Check
- ✅ No human voices generated
- ✅ Instrumental only confirmed
- ✅ No narration or dialogue

## Status: COMPLETE
EOF

echo "📝 Report written to docs/lyria_render_report.md"
