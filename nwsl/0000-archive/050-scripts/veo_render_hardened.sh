#!/bin/bash
# Hardened Veo Pipeline - No placeholders, fail-fast, soccer constraints enforced
set -euo pipefail

# Configuration
PROJECT_ID="pipelinepilot-prod"
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
BUCKET="gs://pipelinepilot-prod-veo-videos"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"
LOG_DIR="070-logs"

# Soccer constraints to append to every prompt
SOCCER_CONTEXT="Context: professional women's soccer (NWSL) and elite youth soccer (ECNL). Use authentic SOCCER visuals only. Pitch: full-size soccer field with white touchlines, halfway line, center circle, penalty boxes, penalty arc, corner flags, and a rectangular goal with netting. Round soccer ball. Avoid: American football/gridiron/rugby. No uprights/goalposts, no yard numbers or hash marks, no end zones, no helmets or shoulder pads, no oval/pointed ball, no NFL signage."

NEGATIVE_PROMPT="American football, gridiron, goalposts, uprights, yard numbers, hash marks, end zones, helmets, shoulder pads, cheerleaders, NFL, rugby, oval ball, scoreboard yard lines, on-screen text, watermarks, logos, captions"

# Initialize
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/veo_render_${TIMESTAMP}.log"

echo "🎬 VEO HARDENED PIPELINE" | tee "$LOG_FILE"
echo "========================" | tee -a "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Function to extract prompt from canon file
extract_canon_prompt() {
    local canon_file=$1

    if [ ! -f "$canon_file" ]; then
        echo "❌ ERROR: Canon file not found: $canon_file" | tee -a "$LOG_FILE"
        exit 1
    fi

    # Extract content between --- markers, escape quotes for JSON
    awk '
        BEGIN { in_content=0; content="" }
        /^---$/ {
            if (!in_content) { in_content=1; next }
            else { exit }
        }
        in_content && NF > 0 {
            if (content != "") content = content " "
            content = content $0
        }
        END { print content }
    ' "$canon_file" | sed 's/"/\\"/g' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//'
}

# Function to submit Veo request with full constraints
submit_veo_request() {
    local segment_id=$1
    local canon_file=$2
    local duration=$3
    local output_dir=$4

    echo "📤 Processing $segment_id..." | tee -a "$LOG_FILE"

    # Extract canon prompt
    local base_prompt=$(extract_canon_prompt "$canon_file")

    if [ -z "$base_prompt" ]; then
        echo "❌ ERROR: Empty prompt from $canon_file" | tee -a "$LOG_FILE"
        exit 1
    fi

    # Append soccer context
    local full_prompt="${base_prompt} ${SOCCER_CONTEXT}"

    # Log prompt length
    echo "  Prompt length: ${#full_prompt} chars" | tee -a "$LOG_FILE"

    # Create request JSON with reference images
    cat > /tmp/${segment_id}_request.json <<JSONEOF
{
  "instances": [{
    "prompt": "$full_prompt",
    "negativePrompt": "$NEGATIVE_PROMPT",
    "aspectRatio": "16:9",
    "generateAudio": false,
    "durationSecs": $duration,
    "referenceImages": [
      {"uri": "https://storage.googleapis.com/hustleapp-production-media/refs/soccer_center_circle.jpg"},
      {"uri": "https://storage.googleapis.com/hustleapp-production-media/refs/soccer_goal_net.jpg"}
    ]
  }],
  "parameters": {
    "frameRate": 24,
    "resolution": "1080p",
    "sampleCount": 1,
    "storageUri": "${BUCKET}/${output_dir}/"
  }
}
JSONEOF

    # Get access token
    ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

    # Submit request
    echo "  Submitting to Veo API..." | tee -a "$LOG_FILE"

    HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_ENDPOINT" \
        -d @/tmp/${segment_id}_request.json)

    # Extract HTTP code and response body
    HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -1)
    RESPONSE_BODY=$(echo "$HTTP_RESPONSE" | head -n -1)

    echo "  HTTP Response Code: $HTTP_CODE" | tee -a "$LOG_FILE"

    if [ "$HTTP_CODE" != "200" ]; then
        echo "❌ ERROR: HTTP $HTTP_CODE" | tee -a "$LOG_FILE"
        echo "Response: $RESPONSE_BODY" | tee -a "$LOG_FILE"
        exit 1
    fi

    # Extract operation name
    OPERATION=$(echo "$RESPONSE_BODY" | jq -r '.name // empty')

    if [ -z "$OPERATION" ]; then
        echo "❌ ERROR: No operation ID in response" | tee -a "$LOG_FILE"
        echo "Response: $RESPONSE_BODY" | tee -a "$LOG_FILE"
        exit 1
    fi

    echo "  ✅ Operation: $OPERATION" | tee -a "$LOG_FILE"
    echo "$OPERATION" > /tmp/${segment_id}_operation.txt

    # Log to operation tracking
    echo "[$TIMESTAMP] $segment_id: $OPERATION" >> "${LOG_DIR}/operations.log"

    return 0
}

echo "✅ Veo pipeline hardened and ready" | tee -a "$LOG_FILE"
echo "Functions defined: extract_canon_prompt, submit_veo_request" | tee -a "$LOG_FILE"
