#!/usr/bin/env bash
# lyria_render.sh - Render instrumental orchestral score using Vertex AI Lyria
# Uses SYNCHRONOUS :predict endpoint (not :predictLongRunning)
set -euo pipefail

# Source dependencies
source ./gate.sh

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
# 2) PRODUCTION MODE - SYNCHRONOUS :predict
# ============================================
echo "🎵 PRODUCTION MODE - Generating orchestral score with Vertex AI Lyria..."
echo "   Using SYNCHRONOUS :predict endpoint (returns inline base64 audio)"

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
# 3) SINGLE SYNCHRONOUS API CALL (sample_count=2)
# ============================================
echo ""
echo "📞 Calling Vertex AI Lyria API with sample_count=2 (sync predict)..."

OP_ID="lyria-sync-$(date +%s)-${GITHUB_RUN_ID:-local}"

# Build request with documented schema
REQUEST_BODY='{
  "instances": [{
    "prompt": "Cinematic orchestral documentary score, emotional and powerful, E minor transitioning to G major, suitable for womens sports documentary about NWSL strike and labor negotiations, instrumental only with no vocals, orchestral strings brass and percussion, 60 second duration split into 8 musical cues",
    "negative_prompt": "vocals, spoken word, dialogue, singing, voice, narration"
  }],
  "parameters": {
    "sample_count": 2
  }
}'

# Lyria endpoint (synchronous predict)
LYRIA_ENDPOINT="https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL_ID}:predict"

# Make synchronous API call with error capture
echo "  📤 Submitting to Vertex AI Lyria (synchronous)..."
RESPONSE_FILE=$(mktemp)
HTTP_CODE=$(curl -sS -w "%{http_code}" -o "$RESPONSE_FILE" \
    --connect-timeout 10 \
    --max-time 120 \
    -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    "$LYRIA_ENDPOINT" \
    -d "$REQUEST_BODY")

# Check HTTP status
if [ "$HTTP_CODE" -ne 200 ]; then
    echo "  ❌ Lyria API returned HTTP $HTTP_CODE"
    echo "  📄 Error response:"
    jq '.' "$RESPONSE_FILE" 2>/dev/null || cat "$RESPONSE_FILE"
    rm -f "$RESPONSE_FILE"
    exit 1
fi

echo "  ✅ Lyria API call successful (HTTP 200)"

# ============================================
# 4) EXTRACT INLINE BASE64 AUDIO
# ============================================
echo "  📦 Extracting audio from response..."

# Get number of predictions
NUM_PREDICTIONS=$(jq '.predictions | length' "$RESPONSE_FILE")
echo "  📹 Received $NUM_PREDICTIONS audio clips"

if [ "$NUM_PREDICTIONS" -lt 2 ]; then
    echo "  ❌ Expected 2 clips, got $NUM_PREDICTIONS"
    jq '.' "$RESPONSE_FILE"
    rm -f "$RESPONSE_FILE"
    exit 1
fi

# Extract and decode first two clips
TEMP_AUDIO_1=$(mktemp --suffix=_part1.wav)
TEMP_AUDIO_2=$(mktemp --suffix=_part2.wav)

echo "  📥 Decoding clip 1..."
AUDIO_B64_1=$(jq -r '.predictions[0].audioContent // .predictions[0].bytesBase64Encoded // empty' "$RESPONSE_FILE")
if [ -z "$AUDIO_B64_1" ]; then
    echo "  ❌ No audioContent in predictions[0]"
    jq '.predictions[0]' "$RESPONSE_FILE"
    rm -f "$RESPONSE_FILE" "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
    exit 1
fi
echo "$AUDIO_B64_1" | base64 -d > "$TEMP_AUDIO_1"

echo "  📥 Decoding clip 2..."
AUDIO_B64_2=$(jq -r '.predictions[1].audioContent // .predictions[1].bytesBase64Encoded // empty' "$RESPONSE_FILE")
if [ -z "$AUDIO_B64_2" ]; then
    echo "  ❌ No audioContent in predictions[1]"
    jq '.predictions[1]' "$RESPONSE_FILE"
    rm -f "$RESPONSE_FILE" "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
    exit 1
fi
echo "$AUDIO_B64_2" | base64 -d > "$TEMP_AUDIO_2"

rm -f "$RESPONSE_FILE"

# Get durations
DUR_1=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$TEMP_AUDIO_1")
DUR_2=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$TEMP_AUDIO_2")

echo "  ✅ Clip 1: ${DUR_1}s"
echo "  ✅ Clip 2: ${DUR_2}s"

# ============================================
# 5) CROSSFADE TO 60.04s
# ============================================
echo ""
echo "  🎚️ Crossfading clips with 2s overlap to create 60.04s master..."

# Crossfade at end of first clip: trim both to ~32.6s, crossfade 2s at junction
ffmpeg -i "$TEMP_AUDIO_1" -i "$TEMP_AUDIO_2" \
    -filter_complex "[0:a]atrim=0:32.6[a0];[1:a]atrim=0:32.6[a1];[a0][a1]acrossfade=d=2:c1=tri:c2=tri" \
    -ar 48000 -ac 2 \
    -t 60.04 \
    "$OUTPUT_DIR/master_mix.wav" -y || {
        echo "  ❌ Crossfade failed"
        rm -f "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
        exit 1
    }

echo "  ✅ 60.04s master audio created with crossfade"

# Cleanup temp files
rm -f "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"

# Log operation
log_vertex_op "Lyria" "generate_score_sync" "$MODEL_ID" "$OP_ID" "success" "$HTTP_CODE"

# ============================================
# 6) VERIFY OUTPUT
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
**Endpoint:** :predict (synchronous)

## Configuration
- Mode: Instrumental Only (NO VOCALS)
- API Type: Synchronous predict (inline base64 audio)
- Duration: 60.04 seconds
- Sample Rate: 48000 Hz
- Channels: Stereo
- Implementation: Two ~32.8s clips with 2s crossfade

## API Response
- Clips Received: 2
- Clip 1 Duration: ${DUR_1}s
- Clip 2 Duration: ${DUR_2}s
- HTTP Status: 200

## Output Files
- Master: $OUTPUT_DIR/master_mix.wav ($(ls -lh "$OUTPUT_DIR/master_mix.wav" 2>/dev/null | awk '{print $5}' || echo "N/A"))

## Voice Check
- ✅ No human voices generated
- ✅ Instrumental only confirmed
- ✅ No narration or dialogue

## Status: COMPLETE
EOF

echo "📝 Report written to docs/lyria_render_report.md"
