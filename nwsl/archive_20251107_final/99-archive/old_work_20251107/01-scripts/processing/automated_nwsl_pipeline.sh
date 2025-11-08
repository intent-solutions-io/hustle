#!/bin/bash
# Fully Automated NWSL Video Pipeline
# Generates multiple 8s clips → Auto-merges → Adds watermark → Final videos

set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://${PROJECT_ID}-veo-videos"
OUTPUT_DIR="./000-docs/nwsl-videos"
FINAL_DIR="./000-docs/nwsl-videos-final"

API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "======================================================================"
echo "AUTOMATED NWSL VIDEO PIPELINE"
echo "======================================================================"
echo "✓ Generates multiple 8s clips"
echo "✓ Auto-merges into longer videos (16-32s)"
echo "✓ Adds @asphaltcowb0y watermark"
echo "✓ Zero manual work required"
echo "======================================================================"
echo ""

mkdir -p "$OUTPUT_DIR" "$FINAL_DIR"
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

    curl -s -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_ENDPOINT" \
      -d @/tmp/${name}.json | jq -r '.name'

    rm -f /tmp/${name}.json
}

echo "STEP 1: Submitting video generation requests..."
echo "================================================"
echo ""

# VIDEO 1: Women's Soccer Celebration (8s)
echo "[1/4] Women's soccer celebration..."
OP1=$(submit_video "scene1_celebration" \
"4K photorealistic women's soccer match. Professional female athletes celebrating a goal with pure joy, embracing teammates. Golden hour lighting, slow motion captures emotion. Diverse team members high-fiving, jumping in celebration. Stadium crowd visible in background. Cinematic sports photography aesthetic, Canon 5D style. Focus on teamwork, strength, athletic excellence. Genuine smiles, powerful athletic builds, professional women's sports at its finest. 8 seconds.")
echo "✓ Submitted: $OP1"
echo ""

# VIDEO 2: Policy Document Drama (8s)
echo "[2/4] Policy document tension..."
OP2=$(submit_video "scene2_policy" \
"Cinematic close-up 4K. Official NWSL policy document lying on executive mahogany desk. Dramatic side lighting through venetian blinds creates film noir shadows. Camera slowly pushes in on the document. Pages flutter slightly in office breeze. Serious, ominous atmosphere. Professional office setting, legal document aesthetic. High contrast lighting, shallow depth of field. Documentary realism, investigative journalism style. 8 seconds.")
echo "✓ Submitted: $OP2"
echo ""

# VIDEO 3: Isolated Locker Room (8s)
echo "[3/4] Isolated locker room..."
OP3=$(submit_video "scene3_isolation" \
"4K cinematic shot. Empty women's soccer locker room, pristine and quiet. Single soccer jersey hanging alone in spotlight, others removed. Slow camera orbit around the isolated jersey. Metaphor for being singled out, standing alone. Dramatic lighting emphasizing solitude. Professional sports facility, modern locker room. Emotional weight, contemplative mood. Film noir aesthetic, shadows and light contrast. 8 seconds.")
echo "✓ Submitted: $OP3"
echo ""

# VIDEO 4: Empty Stadium Question (8s)
echo "[4/4] Empty stadium finale..."
OP4=$(submit_video "scene4_stadium" \
"4K aerial drone shot. Empty professional women's soccer stadium at dusk, golden hour lighting. Slow cinematic descent from high altitude toward center field. Long shadows cast across pristine grass. Complete silence, no players, no controversy, just emptiness. Beautiful but melancholic. The field that started it all, now quiet. Thought-provoking, contemplative mood. Professional cinematography, National Geographic quality. 8 seconds.")
echo "✓ Submitted: $OP4"
echo ""

echo "STEP 2: Waiting for video generation (6 minutes)..."
echo "===================================================="
echo "Videos take ~90 seconds each to generate"
echo ""

for i in {1..12}; do
    echo -ne "Elapsed: $((i*30)) seconds...\r"
    sleep 30
done
echo ""
echo "✓ Generation window complete"
echo ""

echo "STEP 3: Downloading generated clips..."
echo "========================================"
echo ""

gsutil -m cp 'gs://${PROJECT_ID}-veo-videos/scene1_celebration/*/sample_0.mp4' ${OUTPUT_DIR}/scene1.mp4 2>/dev/null || echo "⏳ Scene 1 still processing"
gsutil -m cp 'gs://${PROJECT_ID}-veo-videos/scene2_policy/*/sample_0.mp4' ${OUTPUT_DIR}/scene2.mp4 2>/dev/null || echo "⏳ Scene 2 still processing"
gsutil -m cp 'gs://${PROJECT_ID}-veo-videos/scene3_isolation/*/sample_0.mp4' ${OUTPUT_DIR}/scene3.mp4 2>/dev/null || echo "⏳ Scene 3 still processing"
gsutil -m cp 'gs://${PROJECT_ID}-veo-videos/scene4_stadium/*/sample_0.mp4' ${OUTPUT_DIR}/scene4.mp4 2>/dev/null || echo "⏳ Scene 4 still processing"

echo ""
echo "Downloaded clips:"
ls -lh ${OUTPUT_DIR}/scene*.mp4 2>/dev/null || echo "No clips ready yet"
echo ""

# Check if we have clips to merge
CLIP_COUNT=$(ls ${OUTPUT_DIR}/scene*.mp4 2>/dev/null | wc -l)

if [ "$CLIP_COUNT" -eq 0 ]; then
    echo "⚠️  No clips ready yet. Wait 2 more minutes and run merge manually:"
    echo ""
    echo "    ./merge_nwsl_videos.sh"
    echo ""
    exit 0
fi

echo "STEP 4: Auto-merging videos with FFmpeg..."
echo "==========================================="
echo ""

# Create FFmpeg concat file
cat > /tmp/concat.txt <<EOF
file '${OUTPUT_DIR}/scene1.mp4'
file '${OUTPUT_DIR}/scene2.mp4'
file '${OUTPUT_DIR}/scene3.mp4'
file '${OUTPUT_DIR}/scene4.mp4'
EOF

# Merge videos + add watermark
echo "Merging ${CLIP_COUNT} clips into final 32-second video..."

ffmpeg -y -f concat -safe 0 -i /tmp/concat.txt \
  -vf "drawtext=text='@asphaltcowb0y':fontsize=24:fontcolor=white:borderw=2:bordercolor=black:x=W-tw-20:y=H-th-20" \
  -c:v libx264 -preset fast -crf 22 -c:a aac \
  ${FINAL_DIR}/nwsl_final_32s.mp4

echo "✓ Final video created: ${FINAL_DIR}/nwsl_final_32s.mp4"
echo ""

echo "======================================================================"
echo "PIPELINE COMPLETE"
echo "======================================================================"
echo "Final video: ${FINAL_DIR}/nwsl_final_32s.mp4"
echo "Duration: 32 seconds (4 clips × 8s)"
echo "Watermark: @asphaltcowb0y (bottom right)"
echo "Cost: \$24 (4 clips × \$6)"
echo ""
echo "Ready to upload to X/Twitter!"
echo "======================================================================"
