#!/bin/bash
# Regenerate missing segments 2 and 8
set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "🔄 REGENERATING MISSING SEGMENTS"
echo "================================"
echo ""

# Get access token
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Function to extract and escape prompt from canon file
extract_prompt() {
    local canon_file=$1
    # Extract content between --- markers, escape quotes and newlines for JSON
    awk '
        BEGIN { in_content=0; content="" }
        /^---$/ {
            if (!in_content) { in_content=1; next }
        }
        in_content && NF > 0 {
            if (/^(Conditioning:|Aspect:|Audio:|Repro:|NotesForPost:)/) {
                exit
            }
            if (content != "") content = content " "
            content = content $0
        }
        END { print content }
    ' "$canon_file" | sed 's/"/\\"/g' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//'
}

# Regenerate Segment 2
echo "📤 Submitting Segment 2..."
PROMPT2=$(extract_prompt "000-docs/005-DR-REFF-veo-seg-02.md")
echo "  Prompt length: ${#PROMPT2} chars"

cat > /tmp/seg2_regen.json <<EOF
{
  "instances": [{"prompt": "$PROMPT2"}],
  "parameters": {
    "storageUri": "${BUCKET}/seg2_regen/",
    "sampleCount": 1
  }
}
EOF

RESPONSE2=$(curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT" \
  -d @/tmp/seg2_regen.json)

OP2=$(echo "$RESPONSE2" | jq -r '.name // .error.message // "Error"')
echo "  Operation: $OP2"

# Regenerate Segment 8
echo ""
echo "📤 Submitting Segment 8..."
PROMPT8=$(extract_prompt "000-docs/011-DR-REFF-veo-seg-08.md")
echo "  Prompt length: ${#PROMPT8} chars"

cat > /tmp/seg8_regen.json <<EOF
{
  "instances": [{"prompt": "$PROMPT8"}],
  "parameters": {
    "storageUri": "${BUCKET}/seg8_regen/",
    "sampleCount": 1
  }
}
EOF

RESPONSE8=$(curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT" \
  -d @/tmp/seg8_regen.json)

OP8=$(echo "$RESPONSE8" | jq -r '.name // .error.message // "Error"')
echo "  Operation: $OP8"

echo ""
echo "⏳ Waiting for generation (90 seconds)..."
for i in {1..18}; do
    echo -ne "  Progress: $((i*5))s / 90s\r"
    sleep 5
done

echo ""
echo ""
echo "📥 Downloading regenerated segments..."

# Download Segment 2
echo -n "SEG-02: "
VIDEO2=$(gsutil ls "${BUCKET}/seg2_regen/*/*.mp4" 2>/dev/null | head -1)
if [ -n "$VIDEO2" ]; then
    gsutil cp "$VIDEO2" "030-video/shots/SEG-02_best.mp4"
    SIZE=$(ls -lh "030-video/shots/SEG-02_best.mp4" | awk '{print $5}')
    echo "✅ Downloaded ($SIZE)"
else
    echo "⚠️  Still processing, waiting 30s more..."
    sleep 30
    VIDEO2=$(gsutil ls "${BUCKET}/seg2_regen/*/*.mp4" 2>/dev/null | head -1)
    if [ -n "$VIDEO2" ]; then
        gsutil cp "$VIDEO2" "030-video/shots/SEG-02_best.mp4"
        SIZE=$(ls -lh "030-video/shots/SEG-02_best.mp4" | awk '{print $5}')
        echo "✅ Downloaded ($SIZE)"
    else
        echo "❌ Failed"
    fi
fi

# Download Segment 8
echo -n "SEG-08: "
VIDEO8=$(gsutil ls "${BUCKET}/seg8_regen/*/*.mp4" 2>/dev/null | head -1)
if [ -n "$VIDEO8" ]; then
    gsutil cp "$VIDEO8" "030-video/shots/SEG-08_best.mp4"
    SIZE=$(ls -lh "030-video/shots/SEG-08_best.mp4" | awk '{print $5}')
    echo "✅ Downloaded ($SIZE)"
else
    echo "⚠️  Still processing, waiting 30s more..."
    sleep 30
    VIDEO8=$(gsutil ls "${BUCKET}/seg8_regen/*/*.mp4" 2>/dev/null | head -1)
    if [ -n "$VIDEO8" ]; then
        gsutil cp "$VIDEO8" "030-video/shots/SEG-08_best.mp4"
        SIZE=$(ls -lh "030-video/shots/SEG-08_best.mp4" | awk '{print $5}')
        echo "✅ Downloaded ($SIZE)"
    else
        echo "❌ Failed"
    fi
fi

echo ""
echo "📊 Final segment check:"
ls -lh 030-video/shots/SEG-*.mp4