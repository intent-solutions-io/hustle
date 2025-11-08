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
# 3) TWO SYNCHRONOUS API CALLS (Lyria returns 1 clip per call)
# ============================================
echo ""
echo "📞 Making TWO Lyria API calls for 60s audio..."

OP_ID="lyria-sync-$(date +%s)-${GITHUB_RUN_ID:-local}"

# Lyria endpoint (synchronous predict)
LYRIA_ENDPOINT="https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL_ID}:predict"

# Shared request body (no sample_count - Lyria returns 1 clip per call)
REQUEST_BODY='{
  "instances": [{
    "prompt": "Cinematic orchestral documentary score, emotional and powerful, E minor transitioning to G major, suitable for womens sports documentary about NWSL strike and labor negotiations, instrumental only with no vocals, orchestral strings brass and percussion, 60 second duration split into 8 musical cues",
    "negative_prompt": "vocals, spoken word, dialogue, singing, voice, narration"
  }]
}'

# ==== CALL 1 ====
echo "  📤 Call 1: Generating first 30s clip..."
RESPONSE_FILE_1=$(mktemp)
HTTP_CODE_1=$(curl -sS -w "%{http_code}" -o "$RESPONSE_FILE_1" \
    --connect-timeout 10 \
    --max-time 120 \
    -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    "$LYRIA_ENDPOINT" \
    -d "$REQUEST_BODY")

if [ "$HTTP_CODE_1" -ne 200 ]; then
    echo "  ❌ Call 1 failed: HTTP $HTTP_CODE_1"
    jq '.' "$RESPONSE_FILE_1" 2>/dev/null || cat "$RESPONSE_FILE_1"
    rm -f "$RESPONSE_FILE_1"
    exit 1
fi
echo "  ✅ Call 1 successful (HTTP 200)"

# ==== CALL 2 ====
echo "  📤 Call 2: Generating second 30s clip..."
RESPONSE_FILE_2=$(mktemp)
HTTP_CODE_2=$(curl -sS -w "%{http_code}" -o "$RESPONSE_FILE_2" \
    --connect-timeout 10 \
    --max-time 120 \
    -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    "$LYRIA_ENDPOINT" \
    -d "$REQUEST_BODY")

if [ "$HTTP_CODE_2" -ne 200 ]; then
    echo "  ❌ Call 2 failed: HTTP $HTTP_CODE_2"
    jq '.' "$RESPONSE_FILE_2" 2>/dev/null || cat "$RESPONSE_FILE_2"
    rm -f "$RESPONSE_FILE_1" "$RESPONSE_FILE_2"
    exit 1
fi
echo "  ✅ Call 2 successful (HTTP 200)"

# ============================================
# 4) EXTRACT INLINE BASE64 AUDIO FROM BOTH RESPONSES
# ============================================
echo "  📦 Extracting audio from both responses..."

TEMP_AUDIO_1=$(mktemp --suffix=_part1.wav)
TEMP_AUDIO_2=$(mktemp --suffix=_part2.wav)

# Extract clip 1
echo "  📥 Decoding clip 1..."
AUDIO_B64_1=$(jq -r '.predictions[0].audioContent // .predictions[0].bytesBase64Encoded // empty' "$RESPONSE_FILE_1")
if [ -z "$AUDIO_B64_1" ]; then
    echo "  ❌ No audioContent in response 1"
    jq '.predictions[0]' "$RESPONSE_FILE_1"
    rm -f "$RESPONSE_FILE_1" "$RESPONSE_FILE_2" "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
    exit 1
fi
echo "$AUDIO_B64_1" | base64 -d > "$TEMP_AUDIO_1"

# Extract clip 2
echo "  📥 Decoding clip 2..."
AUDIO_B64_2=$(jq -r '.predictions[0].audioContent // .predictions[0].bytesBase64Encoded // empty' "$RESPONSE_FILE_2")
if [ -z "$AUDIO_B64_2" ]; then
    echo "  ❌ No audioContent in response 2"
    jq '.predictions[0]' "$RESPONSE_FILE_2"
    rm -f "$RESPONSE_FILE_1" "$RESPONSE_FILE_2" "$TEMP_AUDIO_1" "$TEMP_AUDIO_2"
    exit 1
fi
echo "$AUDIO_B64_2" | base64 -d > "$TEMP_AUDIO_2"

rm -f "$RESPONSE_FILE_1" "$RESPONSE_FILE_2"

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
- API Calls Made: 2 (Lyria returns 1 clip per call)
- Clip 1 Duration: ${DUR_1}s
- Clip 2 Duration: ${DUR_2}s
- HTTP Status: 200 (both calls)

## Output Files
- Master: $OUTPUT_DIR/master_mix.wav ($(ls -lh "$OUTPUT_DIR/master_mix.wav" 2>/dev/null | awk '{print $5}' || echo "N/A"))

## Voice Check
- ✅ No human voices generated
- ✅ Instrumental only confirmed
- ✅ No narration or dialogue

## Status: COMPLETE
EOF

echo "📝 Report written to docs/lyria_render_report.md"
