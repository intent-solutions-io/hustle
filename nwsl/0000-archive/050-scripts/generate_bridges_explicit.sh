#!/bin/bash
# BRIDGE TRANSITIONS - QUICK SOCCER MOMENTS
set -euo pipefail

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "🌉 GENERATING 7 BRIDGE TRANSITIONS (1 second each)"
echo "==================================================="
echo ""

# Function to submit bridge
submit_bridge() {
    local NAME=$1
    local PROMPT=$2

    echo "📤 Submitting Bridge $NAME..."

    cat > /tmp/bridge_${NAME}.json <<EOF
{
  "instances": [{
    "prompt": "$PROMPT",
    "negativePrompt": "office, documents, American football, gridiron",
    "aspectRatio": "16:9",
    "generateAudio": false,
    "durationSecs": 1
  }],
  "parameters": {
    "frameRate": 24,
    "resolution": "1080p",
    "sampleCount": 1,
    "storageUri": "${BUCKET}/bridge_${NAME}/"
  }
}
EOF

    ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_ENDPOINT" \
        -d @/tmp/bridge_${NAME}.json)

    OPERATION=$(echo "$RESPONSE" | jq -r '.name // empty')

    if [ -z "$OPERATION" ]; then
        echo "❌ Failed to submit Bridge $NAME"
        echo "$RESPONSE"
        return 1
    fi

    echo "✅ Bridge $NAME submitted"
}

# Submit all bridges
submit_bridge "12" "Soccer ball rolling across grass field closeup, white lines visible"
submit_bridge "23" "Young girl soccer player turning to look at camera, concerned expression"
submit_bridge "34" "Wide aerial pan across modern soccer stadium exterior"
submit_bridge "45" "Soccer cleat stepping on ball, ready to kick"
submit_bridge "56" "Quick transition wipe with soccer ball passing through frame"
submit_bridge "67" "Parent's hand pointing toward soccer field"
submit_bridge "78" "Sun flare over soccer goal net at golden hour"

echo ""
echo "⏳ All bridges submitted. Waiting 90 seconds..."
sleep 90

echo ""
echo "📥 Attempting to download bridges..."

# Download function
download_bridge() {
    local NAME=$1
    local VIDEO_PATH=$(gsutil ls "${BUCKET}/bridge_${NAME}/**/*.mp4" 2>/dev/null | head -1)

    if [ -n "$VIDEO_PATH" ]; then
        gsutil cp "$VIDEO_PATH" ./segments/BR-${NAME}.mp4
        echo "✅ Downloaded BR-${NAME}.mp4"
        return 0
    else
        echo "⚠️ Bridge ${NAME} still processing"
        return 1
    fi
}

# Try downloading all bridges
READY_COUNT=0
for bridge in 12 23 34 45 56 67 78; do
    if download_bridge $bridge; then
        ((READY_COUNT++))
    fi
done

echo ""
echo "======================================="
echo "📊 Status: $READY_COUNT/7 bridges ready"
echo ""
echo "Check later with:"
echo "for b in 12 23 34 45 56 67 78; do"
echo "  gsutil ls '${BUCKET}/bridge_\${b}/**/*.mp4'"
echo "done"