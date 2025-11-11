#!/bin/bash
# EXPLICIT SOCCER-ONLY SEGMENT GENERATION
# After 3 days, we know Veo needs EXTREME explicitness
set -euo pipefail

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "🎯 GENERATING ALL SEGMENTS WITH EXPLICIT SOCCER CONTENT"
echo "======================================================="
echo ""

# NEGATIVE PROMPT FOR ALL SEGMENTS
NEGATIVE="office, boardroom, documents, papers, desk, computer, indoor, meeting room, conference, American football, gridiron, yard lines, uprights, oval ball, helmet, PowerPoint, presentation, business attire, suits"

# Function to submit segment
submit_segment() {
    local NUM=$1
    local PROMPT=$2
    local DURATION=$3

    echo "📤 Submitting Segment $NUM..."

    cat > /tmp/seg${NUM}_explicit.json <<EOF
{
  "instances": [{
    "prompt": "$PROMPT",
    "negativePrompt": "$NEGATIVE",
    "aspectRatio": "16:9",
    "generateAudio": false,
    "durationSecs": $DURATION
  }],
  "parameters": {
    "frameRate": 24,
    "resolution": "1080p",
    "sampleCount": 1,
    "storageUri": "${BUCKET}/seg${NUM}_explicit/"
  }
}
EOF

    ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_ENDPOINT" \
        -d @/tmp/seg${NUM}_explicit.json)

    OPERATION=$(echo "$RESPONSE" | jq -r '.name // empty')

    if [ -z "$OPERATION" ]; then
        echo "❌ Failed to submit Segment $NUM"
        echo "$RESPONSE"
        return 1
    fi

    echo "✅ Segment $NUM submitted: $OPERATION"
    echo "$OPERATION" > /tmp/seg${NUM}_operation.txt
}

# SEGMENT 1 - Already done, but including for completeness
echo "✅ Segment 1 already generated (SEG-01_FINAL.mp4)"

# SEGMENT 2 - Training Fields
PROMPT2="Young female soccer players aged 10-12 in bright colored soccer jerseys (blue, red, yellow) on outdoor grass soccer training field. Girls practicing soccer drills, dribbling soccer balls through orange cones, passing drills. Soccer goals with white nets visible in background. Bright sunny day on soccer field with field markings. Wide shot showing multiple soccer training activities. SOCCER FIELD ONLY."
submit_segment 2 "$PROMPT2" 8

# SEGMENT 3 - Boardroom (keeping indoor but NOT office documents)
PROMPT3="Professional women in business attire sitting around modern conference table in bright boardroom. Women having animated discussion, gesturing while talking. Modern office interior with large windows showing city view. Professional meeting atmosphere. No papers or documents visible, just people talking. Conference room conversation."
submit_segment 3 "$PROMPT3" 8

# SEGMENT 4 - Stadium
PROMPT4="Large professional soccer stadium exterior shot showing curved modern architecture. Kansas City Current CPKC Stadium with distinctive design. Aerial or wide establishing shot of soccer-specific stadium. Bright daylight, clear sky. Stadium surrounded by parking areas and landscaping. Professional women's soccer venue. SOCCER STADIUM ONLY."
submit_segment 4 "$PROMPT4" 8

# SEGMENT 5 - Youth Match
PROMPT5="Young female soccer players aged 13-15 playing competitive soccer match on full-size grass field. Girls wearing team uniforms running after soccer ball, midfielder passing to forward, defender challenging for ball. Referee in black visible. Parents watching from sideline. Soccer goals, corner flags, field lines clearly visible. Dynamic game action. SOCCER MATCH ONLY."
submit_segment 5 "$PROMPT5" 8

# SEGMENT 6 - Eligibility Question (visual metaphor)
PROMPT6="Split screen or transition effect showing contrast: Left side shows young girls soccer team in colorful jerseys on soccer field looking confused and concerned. Right side shows silhouette figure with question mark. Visual representation of uncertainty and questioning. Dramatic lighting suggesting conflict or difficult questions. CONCEPTUAL BUT SOCCER-FOCUSED."
submit_segment 6 "$PROMPT6" 8

# SEGMENT 7 - Frustrated Parents
PROMPT7="Parents on soccer sideline looking concerned and frustrated, arms crossed, shaking heads. Diverse group of parents in casual clothes standing by soccer field sideline. Some pointing at field, others in discussion groups. Soccer game happening in soft focus background. Emotional reactions from adults watching youth soccer. SIDELINE OF SOCCER FIELD."
submit_segment 7 "$PROMPT7" 8

# SEGMENT 8 - Future Vision
PROMPT8="Montage sequence: Young girl in soccer jersey looking determined at camera, close-up of soccer cleats kicking ball, hands holding trophy, team celebrating with arms raised on soccer field at golden hour sunset. Inspiring imagery of girls soccer success and dreams. Hope and determination theme. SOCCER TRIUMPH IMAGERY."
submit_segment 8 "$PROMPT8" 10

echo ""
echo "⏳ All segments submitted. Waiting 2 minutes for generation..."
sleep 120

echo ""
echo "📥 Attempting to download generated segments..."

# Download function
download_segment() {
    local NUM=$1
    local VIDEO_PATH=$(gsutil ls "${BUCKET}/seg${NUM}_explicit/**/*.mp4" 2>/dev/null | head -1)

    if [ -n "$VIDEO_PATH" ]; then
        gsutil cp "$VIDEO_PATH" ./segments/SEG-0${NUM}_FINAL.mp4
        echo "✅ Downloaded SEG-0${NUM}_FINAL.mp4"

        # Extract preview frame
        ffmpeg -y -ss 4 -i ./segments/SEG-0${NUM}_FINAL.mp4 -frames:v 1 ./segments/preview_seg${NUM}.png 2>/dev/null
        echo "📸 Preview: preview_seg${NUM}.png"
        return 0
    else
        echo "⚠️ Segment $NUM still processing"
        return 1
    fi
}

# Try downloading all segments
READY_COUNT=0
for i in {2..8}; do
    if download_segment $i; then
        ((READY_COUNT++))
    fi
done

echo ""
echo "======================================="
echo "📊 Status: $((READY_COUNT+1))/8 segments ready (including SEG-01)"
echo ""
echo "Check later with:"
echo "for i in {2..8}; do"
echo "  gsutil ls '${BUCKET}/seg\${i}_explicit/**/*.mp4'"
echo "done"
echo ""
echo "Next step: Run bridge generation once all segments ready"
echo "./050-scripts/generate_bridges_explicit.sh"