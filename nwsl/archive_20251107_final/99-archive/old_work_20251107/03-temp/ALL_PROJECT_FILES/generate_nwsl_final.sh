#!/bin/bash
# ONE-COMMAND NWSL VIDEO GENERATION
# Fully automated: Generate → Merge → Watermark → Download
# Zero manual work required

set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://${PROJECT_ID}-veo-videos"
FINAL_DIR="./000-docs/nwsl-videos-final"

API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

# Cloud Run merger URL
MERGER_URL="https://video-merger-365258353703.us-central1.run.app"

echo "======================================================================"
echo "FULLY AUTOMATED NWSL VIDEO PIPELINE"
echo "======================================================================"
echo "What happens:"
echo "  1. Generates 4 cinematic 8-second clips (pure visuals, NO TEXT)"
echo "  2. Waits 6 minutes for generation"
echo "  3. Auto-merges clips in the cloud"
echo "  4. Adds @asphaltcowb0y watermark"
echo "  5. Downloads final 32-second video"
echo ""
echo "Cost: \$24 (4 clips × \$6)"
echo "Duration: ~8 minutes total"
echo "Output: One 32-second video ready for X/Twitter"
echo "======================================================================"
echo ""
echo "Starting autonomous generation..."
echo ""

mkdir -p "$FINAL_DIR"
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Function to submit video generation
submit_video() {
    local name=$1
    local prompt=$2

    cat > /tmp/${name}.json <<EOF
{
  "instances": [{"prompt": "$prompt"}],
  "parameters": {"storageUri": "${BUCKET}/${name}/", "sampleCount": 1}
}
EOF

    RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_ENDPOINT" \
      -d @/tmp/${name}.json)

    rm -f /tmp/${name}.json
    echo "$RESPONSE" | jq -r '.name // .error.message'
}

echo "STEP 1/4: Submitting video generation requests"
echo "==============================================="
echo ""

echo "[1/4] Women's soccer celebration (pure joy, teamwork, strength)..."
OP1=$(submit_video "scene1_celebration" "4K photorealistic women's soccer match. Professional female athletes celebrating a goal with pure joy, embracing teammates. Golden hour lighting, slow motion captures emotion. Diverse team members high-fiving, jumping in celebration. Stadium crowd visible in background. Cinematic sports photography aesthetic, Canon 5D style. Focus on teamwork, strength, athletic excellence. Genuine smiles, powerful athletic builds, professional women's sports at its finest. 8 seconds.")
echo "✓ $OP1"
echo ""

echo "[2/4] Policy document drama (film noir tension building)..."
OP2=$(submit_video "scene2_policy" "Cinematic close-up 4K. Official NWSL policy document lying on executive mahogany desk. Dramatic side lighting through venetian blinds creates film noir shadows. Camera slowly pushes in on the document. Pages flutter slightly in office breeze. Serious, ominous atmosphere. Professional office setting, legal document aesthetic. High contrast lighting, shallow depth of field. Documentary realism, investigative journalism style. 8 seconds.")
echo "✓ $OP2"
echo ""

echo "[3/4] Isolated locker room (metaphor for being singled out)..."
OP3=$(submit_video "scene3_isolation" "4K cinematic shot. Empty women's soccer locker room, pristine and quiet. Single soccer jersey hanging alone in spotlight, others removed. Slow camera orbit around the isolated jersey. Metaphor for being singled out, standing alone. Dramatic lighting emphasizing solitude. Professional sports facility, modern locker room. Emotional weight, contemplative mood. Film noir aesthetic, shadows and light contrast. 8 seconds.")
echo "✓ $OP3"
echo ""

echo "[4/4] Empty stadium (powerful melancholic finale)..."
OP4=$(submit_video "scene4_stadium" "4K aerial drone shot. Empty professional women's soccer stadium at dusk, golden hour lighting. Slow cinematic descent from high altitude toward center field. Long shadows cast across pristine grass. Complete silence, no players, no controversy, just emptiness. Beautiful but melancholic. The field that started it all, now quiet. Thought-provoking, contemplative mood. Professional cinematography, National Geographic quality. 8 seconds.")
echo "✓ $OP4"
echo ""

echo "STEP 2/4: Waiting for video generation"
echo "======================================="
echo "Videos take ~90 seconds each to generate"
echo "Total wait: 6 minutes"
echo ""

for i in {1..12}; do
    elapsed=$((i*30))
    remaining=$((360-elapsed))
    echo -ne "Elapsed: ${elapsed}s | Remaining: ${remaining}s\r"
    sleep 30
done
echo ""
echo "✓ Generation window complete"
echo ""

echo "STEP 3/4: Auto-merging videos in the cloud"
echo "==========================================="
echo "Calling Cloud Run merger service..."
echo ""

# Call Cloud Run merger
MERGE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  "$MERGER_URL/merge" \
  -d '{
    "bucket": "'${PROJECT_ID}'-veo-videos",
    "scenes": ["scene1_celebration", "scene2_policy", "scene3_isolation", "scene4_stadium"],
    "output": "nwsl_final_32s.mp4",
    "watermark": "@asphaltcowb0y"
  }')

SUCCESS=$(echo "$MERGE_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
    OUTPUT_URL=$(echo "$MERGE_RESPONSE" | jq -r '.output_url')
    echo "✓ Video merged successfully!"
    echo "✓ Cloud Storage: $OUTPUT_URL"
else
    echo "✗ Merge failed:"
    echo "$MERGE_RESPONSE" | jq '.'
    exit 1
fi

echo ""
echo "STEP 4/4: Downloading final video"
echo "=================================="
echo ""

gsutil cp "$OUTPUT_URL" ${FINAL_DIR}/nwsl_final_32s.mp4

echo "✓ Downloaded: ${FINAL_DIR}/nwsl_final_32s.mp4"
echo ""

# Show file info
ls -lh ${FINAL_DIR}/nwsl_final_32s.mp4
echo ""

echo "======================================================================"
echo "PIPELINE COMPLETE!"
echo "======================================================================"
echo "Final video: ${FINAL_DIR}/nwsl_final_32s.mp4"
echo "Duration: 32 seconds (4 clips merged)"
echo "Watermark: @asphaltcowb0y (bottom right)"
echo "Cost: \$24"
echo ""
echo "Story arc:"
echo "  1. Women's soccer celebration (pure joy)"
echo "  2. Policy document (tension builds)"
echo "  3. Isolated locker room (controversy metaphor)"
echo "  4. Empty stadium (powerful question)"
echo ""
echo "Ready to upload to X/Twitter!"
echo "======================================================================"
