#!/bin/bash
# Test segment 2 with cleaned prompt
set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "🔍 DEBUGGING SEGMENT 2"
echo "====================="

# Get access token
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Clean prompt - removing problematic quotes
PROMPT="Create PHOTOREALISTIC 8-second video. Shot on RED camera. Empty corporate executive office. Slow push-in on dark wood desk with nameplate, official NWSL documents visible, leather executive chair facing away toward floor-to-ceiling windows showing city skyline. Cold fluorescent and natural window lighting creating institutional atmosphere. Official plaques on wall, coffee cup abandoned on desk, silent and powerful but disconnected. Camera slowly dollies toward the empty chair. Cinematography: Cold blue color grading, sharp focus, corporate documentary style, deliberate slow camera movement, 24fps cinematic. Style: The Social Network or Margin Call - cold institutional power."

echo "Prompt: $PROMPT"
echo ""
echo "Creating JSON payload..."

# Create request
cat > /tmp/seg2_debug.json <<JSON
{
  "instances": [{"prompt": "$PROMPT"}],
  "parameters": {
    "storageUri": "${BUCKET}/seg2_debug/",
    "sampleCount": 1
  }
}
JSON

echo "JSON payload created. Submitting..."

# Submit
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT" \
  -d @/tmp/seg2_debug.json)

echo "Response: $RESPONSE"

# Extract operation name
OPERATION=$(echo "$RESPONSE" | jq -r '.name // .error.message // "Error"')

if [[ "$OPERATION" == "projects/"* ]]; then
    echo "✅ SUCCESS! Operation: $OPERATION"
    echo "$OPERATION" > /tmp/seg2_operation.txt
else
    echo "❌ FAILED: $OPERATION"
    echo "Full response:"
    echo "$RESPONSE" | jq '.'
fi
