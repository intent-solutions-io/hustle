#!/bin/bash
# ONE SEGMENT. DONE RIGHT. SOCCER ONLY.
set -euo pipefail

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "🎯 GENERATING SEGMENT 01 - EXPLICIT SOCCER VERSION"
echo "=================================================="
echo ""

# SUPER EXPLICIT PROMPT
PROMPT="Young female soccer players aged 12-14 wearing colorful soccer jerseys on a grass soccer field with visible white chalk lines, soccer goals with nets, corner flags. Girls are actively playing soccer, kicking a round soccer ball, running on the field. One girl in the center looks directly at camera with questioning expression. Bright outdoor daylight. Wide shot showing the full soccer field with proper markings including center circle, penalty box. SOCCER ONLY. Female youth soccer players. Real soccer field. Soccer ball visible."

NEGATIVE="office, boardroom, documents, papers, desk, computer, indoor, meeting room, conference, American football, gridiron, yard lines, uprights, oval ball, helmet"

# Create request
cat > /tmp/seg01_explicit.json <<EOF
{
  "instances": [{
    "prompt": "$PROMPT",
    "negativePrompt": "$NEGATIVE",
    "aspectRatio": "16:9",
    "generateAudio": false,
    "durationSecs": 8
  }],
  "parameters": {
    "frameRate": 24,
    "resolution": "1080p",
    "sampleCount": 1,
    "storageUri": "${BUCKET}/seg01_explicit/"
  }
}
EOF

echo "📝 Prompt: Young girls on soccer field playing soccer..."
echo ""

# Submit
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

echo "📤 Submitting to Veo..."
RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    "$API_ENDPOINT" \
    -d @/tmp/seg01_explicit.json)

OPERATION=$(echo "$RESPONSE" | jq -r '.name // empty')

if [ -z "$OPERATION" ]; then
    echo "❌ Failed to submit"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Operation: $OPERATION"
echo ""
echo "⏳ Waiting 90 seconds for generation..."
sleep 90

# Try to download
echo "📥 Attempting download..."
gsutil ls "${BUCKET}/seg01_explicit/**/*.mp4" 2>/dev/null | head -1 | while read VIDEO_PATH; do
    if [ -n "$VIDEO_PATH" ]; then
        gsutil cp "$VIDEO_PATH" ./SEG-01_explicit_soccer.mp4
        echo "✅ Downloaded: SEG-01_explicit_soccer.mp4"

        # Extract a frame to verify
        ffmpeg -y -ss 4 -i SEG-01_explicit_soccer.mp4 -frames:v 1 SEG-01_preview.png 2>/dev/null
        echo "📸 Preview frame: SEG-01_preview.png"
        echo ""
        echo "CHECK THE PREVIEW to see if we FINALLY got soccer!"
    fi
done

if [ ! -f "SEG-01_explicit_soccer.mp4" ]; then
    echo "⚠️ Still processing. Check later with:"
    echo "gsutil ls '${BUCKET}/seg01_explicit/**/*.mp4'"
fi