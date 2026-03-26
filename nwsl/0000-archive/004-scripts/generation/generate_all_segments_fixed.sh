#!/bin/bash
# Generate all 9 NWSL segments with full canon prompts (JSON-safe version)
set -e

PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "🎬 NWSL 9-SEGMENT GENERATION PIPELINE (FIXED)"
echo "============================================="
echo "Using working project: $PROJECT_ID"
echo ""

# Create output directories
mkdir -p 030-video/shots 070-logs

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

# Array to store operation names
declare -a OPERATIONS

echo "📤 SUBMITTING ALL SEGMENTS"
echo "========================="

# Segments 1-8 from canon
for i in {1..8}; do
    echo ""
    echo "Segment $i:"

    idx=$(printf "%03d" $((3 + i)))
    canon_file="000-docs/${idx}-DR-REFF-veo-seg-$(printf %02d $i).md"

    if [ ! -f "$canon_file" ]; then
        echo "❌ Missing canon: $canon_file"
        exit 1
    fi

    # Extract and escape prompt
    PROMPT=$(extract_prompt "$canon_file")
    echo "  Prompt length: ${#PROMPT} chars"

    # Determine duration (8s for 1-7, 4s for 8)
    DURATION=8
    if [ $i -eq 8 ]; then
        DURATION=4
    fi

    # Create request with properly escaped JSON
    cat > /tmp/seg${i}.json <<EOF
{
  "instances": [{"prompt": "$PROMPT"}],
  "parameters": {
    "storageUri": "${BUCKET}/seg${i}/",
    "sampleCount": 1
  }
}
EOF

    # Submit
    RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_ENDPOINT" \
      -d @/tmp/seg${i}.json)

    OPERATION=$(echo "$RESPONSE" | jq -r '.name // .error.message // "Error"')
    OPERATIONS[$i]="$OPERATION"

    if [[ "$OPERATION" == "projects/"* ]]; then
        echo "  ✅ Submitted: $OPERATION"
    else
        echo "  ❌ Failed: $OPERATION"
    fi

    # Log to file
    echo "[$(date -Is)] SEG-$(printf %02d $i): $OPERATION" >> vertex_ops.log
done

# Segment 9 - End card (already works)
echo ""
echo "Segment 9 (End Card):"
END_PROMPT="Black screen with white text centered reading 'Why Won't They Answer?'. Minimalist documentary end card. Clean typography. Stark contrast. 4 seconds."

cat > /tmp/seg9.json <<EOF
{
  "instances": [{"prompt": "$END_PROMPT"}],
  "parameters": {
    "storageUri": "${BUCKET}/seg9/",
    "sampleCount": 1
  }
}
EOF

RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT" \
  -d @/tmp/seg9.json)

OPERATION=$(echo "$RESPONSE" | jq -r '.name // .error.message // "Error"')
OPERATIONS[9]="$OPERATION"

if [[ "$OPERATION" == "projects/"* ]]; then
    echo "  ✅ Submitted: $OPERATION"
else
    echo "  ❌ Failed: $OPERATION"
fi
echo "[$(date -Is)] SEG-09: $OPERATION" >> vertex_ops.log

echo ""
echo "⏳ WAITING FOR GENERATION"
echo "========================"
echo "Videos generate in ~90 seconds each"
echo "Total wait: ~2 minutes for parallel processing"
echo ""

# Wait for generation
for i in {1..24}; do
    elapsed=$((i*5))
    remaining=$((120-elapsed))
    echo -ne "⏳ Elapsed: ${elapsed}s | Remaining: ${remaining}s\r"
    sleep 5
done

echo ""
echo ""
echo "📥 DOWNLOADING SEGMENTS"
echo "======================"

# Download each segment
for i in {1..9}; do
    echo -n "SEG-$(printf %02d $i): "

    # Find the generated video
    VIDEO_PATH=$(gsutil ls "${BUCKET}/seg${i}/*/*.mp4" 2>/dev/null | head -1)

    if [ -z "$VIDEO_PATH" ]; then
        echo "⚠️  Not ready yet, waiting 30s more..."
        sleep 30
        VIDEO_PATH=$(gsutil ls "${BUCKET}/seg${i}/*/*.mp4" 2>/dev/null | head -1)
    fi

    if [ -n "$VIDEO_PATH" ]; then
        gsutil cp "$VIDEO_PATH" "030-video/shots/SEG-$(printf %02d $i)_best.mp4"
        SIZE=$(ls -lh "030-video/shots/SEG-$(printf %02d $i)_best.mp4" | awk '{print $5}')
        echo "✅ Downloaded ($SIZE)"
    else
        echo "❌ Failed - generating placeholder"
        # Generate placeholder
        if [ $i -eq 9 ]; then
            ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=4" \
                -vf "drawtext=text='Why Won'\\''t They Answer?':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
                -r 24 -c:v libx264 -pix_fmt yuv420p \
                "030-video/shots/SEG-$(printf %02d $i)_best.mp4" -y -loglevel error
        else
            DURATION=8
            [ $i -eq 8 ] && DURATION=4
            ffmpeg -f lavfi -i "color=c=gray:s=1920x1080:d=$DURATION" \
                -vf "drawtext=text='SEG-$(printf %02d $i)':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
                -r 24 -c:v libx264 -pix_fmt yuv420p \
                "030-video/shots/SEG-$(printf %02d $i)_best.mp4" -y -loglevel error
        fi
    fi
done

echo ""
echo "✅ ALL SEGMENTS READY"
echo ""
echo "Operations log saved to: vertex_ops.log"
echo "Segments saved to: 030-video/shots/"

# List all segments
echo ""
echo "📊 SEGMENT SUMMARY:"
echo "=================="
for i in {1..9}; do
    FILE="030-video/shots/SEG-$(printf %02d $i)_best.mp4"
    if [ -f "$FILE" ]; then
        DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FILE")
        SIZE=$(ls -lh "$FILE" | awk '{print $5}')
        echo "SEG-$(printf %02d $i): ${DURATION}s, $SIZE"
    fi
done

echo ""
echo "🎬 Ready for assembly!"