#!/bin/bash
# generate_missing_segments.sh
# Generate segments 10-12 for NWSL 90-second documentary

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-preview"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"
BUCKET="gs://hustleapp-production-logos/nwsl90"

echo "🎬 Generating Missing NWSL90 Segments (10-12)"
echo "Project: ${PROJECT_ID}"
echo "Bucket: ${BUCKET}"
echo

ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"

# Segment 10: Reflection (72-78s, 6 seconds)
echo "📤 Segment 10 - Reflection (empty field at dusk)..."
response_10=$(curl -s -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  "${API_ENDPOINT}" \
  -d '{
    "instances": [{
      "prompt": "Create PHOTOREALISTIC 6-second video. Shot on RED camera. NO TEXT visible.\n\nEmpty youth soccer field at dusk with purple-orange sky. Goalposts silhouetted against sunset. Single soccer ball on grass in center of frame. Camera slowly moves toward ball. Empty field, twilight atmosphere.\n\nBeautiful contemplative scene, no people.\n\nCinematography: Slow dolly-in movement from wide shot to medium shot of soccer ball. Golden hour/twilight lighting with purple-orange gradient sky. Shallow depth of field on ball in foreground, goalposts soft focus in background.\n\nColor grading: Warm twilight tones, desaturated greens, rich orange-purple sky gradient. Cinematic color science (ARRI Alexa look).\n\nStyle: Cinematic landscape, twilight photography, emotional documentary shot."
    }],
    "parameters": {
      "storageUri": "'"${BUCKET}/segment-10/"'",
      "sampleCount": 1,
      "durationSeconds": 6,
      "aspectRatio": "16:9",
      "resolution": "1080p",
      "generateAudio": false
    }
  }')

operation_10=$(echo "${response_10}" | jq -r '.name // empty')
if [[ -n "${operation_10}" ]]; then
  echo "  ✅ Submitted: ${operation_10}"
else
  echo "  ❌ Failed: ${response_10}"
fi

echo

# Segment 11: The Question (78-84s, 6 seconds)
echo "📤 Segment 11 - The Question (athlete portrait)..."
response_11=$(curl -s -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  "${API_ENDPOINT}" \
  -d '{
    "instances": [{
      "prompt": "Create PHOTOREALISTIC 6-second video. Shot on RED camera. NO TEXT visible.\n\nClose-up of young female athlete age 17-18 in soccer uniform. Twilight lighting on face. She looks at camera with serious, thoughtful expression. Composed, dignified, questioning look. Strong eye contact showing determination and thoughtfulness.\n\nNot crying or distressed - professional athlete portrait showing thoughtful contemplation.\n\nCinematography: Tight close-up (CU) on face, shallow depth of field (f/2.8), twilight natural key light from camera left, soft fill from right. Athlete stands still, maintains eye contact with camera. Slight head tilt suggesting questioning posture.\n\nWardrobe: Clean soccer jersey (purple or red), hair pulled back in ponytail, minimal makeup, natural athlete appearance.\n\nLighting: Twilight golden hour, soft directional light creating gentle shadows, warm skin tones, professional portrait lighting setup.\n\nStyle: Portrait cinematography, shallow depth of field, twilight lighting, prestige quality documentary portrait."
    }],
    "parameters": {
      "storageUri": "'"${BUCKET}/segment-11/"'",
      "sampleCount": 1,
      "durationSeconds": 6,
      "aspectRatio": "16:9",
      "resolution": "1080p",
      "generateAudio": false
    }
  }')

operation_11=$(echo "${response_11}" | jq -r '.name // empty')
if [[ -n "${operation_11}" ]]; then
  echo "  ✅ Submitted: ${operation_11}"
else
  echo "  ❌ Failed: ${response_11}"
fi

echo

# Segment 12: Outro Fade (84-90s, 6 seconds)
echo "📤 Segment 12 - Outro Fade (fade to black)..."
response_12=$(curl -s -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  "${API_ENDPOINT}" \
  -d '{
    "instances": [{
      "prompt": "Create 6-second video: Smooth gradual fade from twilight sky to complete black screen over 6 seconds. Clean professional fade. Documentary ending.\n\nStart frame: Twilight sky with purple-orange gradient.\nMiddle (3s): Sky gradually darkens, colors desaturate, transition to deep blue-black.\nEnd frame (6s): Pure black screen, no noise, clean matte black.\n\nTransition: Linear fade, professional broadcast quality, no visible banding or compression artifacts.\n\nStyle: Professional documentary outro, cinematic fade to black, prestige ending."
    }],
    "parameters": {
      "storageUri": "'"${BUCKET}/segment-12/"'",
      "sampleCount": 1,
      "durationSeconds": 6,
      "aspectRatio": "16:9",
      "resolution": "1080p",
      "generateAudio": false
    }
  }')

operation_12=$(echo "${response_12}" | jq -r '.name // empty')
if [[ -n "${operation_12}" ]]; then
  echo "  ✅ Submitted: ${operation_12}"
else
  echo "  ❌ Failed: ${response_12}"
fi

echo
echo "✅ All 3 segments submitted to Vertex AI"
echo
echo "📥 Monitoring generation progress..."
echo "   Bucket: ${BUCKET}"
echo
echo "Wait ~90-120 seconds, then check:"
echo "  gsutil ls ${BUCKET}/segment-10/*/*.mp4"
echo "  gsutil ls ${BUCKET}/segment-11/*/*.mp4"
echo "  gsutil ls ${BUCKET}/segment-12/*/*.mp4"
