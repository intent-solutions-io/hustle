#!/usr/bin/env bash
# veo_render.sh - Generate video segments with Vertex AI Veo
set -euo pipefail

# Enforce working directory
[[ -d 050-scripts ]] || { echo "[FATAL] run from repo root (nwsl)"; exit 1; }

# Source dependencies
source ./gate.sh
source 050-scripts/_lro.sh

# Set DOCS_DIR
: "${DOCS_DIR:=./docs}"

echo "🎬 Veo Render - Video Segments"
echo "=============================="
echo "Canon directory: $DOCS_DIR"

# Canon path functions - segment N maps to file %03d = (3+N)
canon_seg_path() {
    local n="$1"
    printf "%s/%03d-DR-REFF-veo-seg-%02d.md" "${DOCS_DIR}" "$((3+n))" "$n"
}

load_prompt() {
    local n="$1"
    local p
    p="$(canon_seg_path "$n")"

    [[ -f "$p" ]] || { echo "[FATAL] missing canon: $p" >&2; exit 1; }

    echo "  Loading prompt from: $p" >&2

    # Extract prompt content after --- delimiter, before Conditioning:
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
    ' "$p" | sed 's/  */ /g' | sed 's/^ *//;s/ *$//'
}

# Model configuration
: "${PROJECT_ID:?missing}"
: "${REGION:=us-central1}"
: "${DRY_RUN:=false}"

MODEL_ID="veo-3.0-generate-001"
VEO_MODEL="projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL_ID}"
OUTPUT_DIR="030-video/shots"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Veo API functions
submit_veo() {
    local prompt="$1"
    local dur="$2"
    local seg_num="$3"

    echo "  📤 Submitting to Veo API..." >&2
    echo "  Prompt length: ${#prompt} characters" >&2

    # Build request body
    local body
    body=$(jq -n \
        --arg p "$prompt" \
        --argjson d "$dur" \
        '{
            instances: [{
                prompt: $p
            }],
            parameters: {
                aspectRatio: "16:9",
                resolution: "1080p",
                durationSeconds: $d,
                generateAudio: false,
                sampleCount: 1
            }
        }')

    # Submit request
    local resp_file=$(mktemp)
    local http_code
    http_code=$(curl -sS -o "$resp_file" -w "%{http_code}" \
        --connect-timeout 10 \
        --max-time 60 \
        -X POST \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "Content-Type: application/json" \
        "https://${REGION}-aiplatform.googleapis.com/v1/${VEO_MODEL}:predictLongRunning" \
        -d "$body")

    if [[ "$http_code" != "200" ]]; then
        echo "  ❌ [VEO SUBMIT ERROR] HTTP $http_code for SEG-${seg_num}" >&2
        echo "  📄 Error response:" >&2
        jq '.' "$resp_file" 2>/dev/null || cat "$resp_file" >&2

        # Write error documentation
        mkdir -p docs
        local error_doc="docs/$(date +%s)-LS-STAT-veo-seg-${seg_num}-api-error.md"
        cat > "$error_doc" << EOF
# Veo API Error - SEG-${seg_num}
**Date:** $(date +%Y-%m-%d\ %H:%M:%S)
**HTTP Code:** $http_code

## Request
\`\`\`json
$body
\`\`\`

## Response
\`\`\`json
$(jq '.' "$resp_file" 2>/dev/null || cat "$resp_file")
\`\`\`
EOF
        rm -f "$resp_file"
        exit 1
    fi

    # Extract operation name
    local op_name
    op_name=$(jq -r '.name' "$resp_file")
    rm -f "$resp_file"

    if [[ -z "$op_name" ]] || [[ "$op_name" == "null" ]]; then
        echo "  ❌ No operation name in response" >&2
        exit 1
    fi

    echo "$op_name"
}

poll_veo() {
    local op="$1"
    local t=0
    local max_time=3600

    echo "  ⏳ Polling operation: $op" >&2

    while (( t < max_time )); do
        local r
        r=$(curl -sS -H "Authorization: Bearer $(gcloud auth print-access-token)" \
            "https://${REGION}-aiplatform.googleapis.com/v1/${op}")

        if [[ "$(jq -r '.done // false' <<<""$r")" == "true" ]]; then
            echo "$r"
            return 0
        fi

        # Show progress
        if (( t % 60 == 0 )); then
            echo "    Polling... ${t}s elapsed" >&2
        fi

        sleep 10
        t=$((t + 10))
    done

    echo "  ❌ [POLL] Timeout after ${max_time}s" >&2
    return 124
}

gen_segment() {
    local n="$1"
    local dur="$2"
    local seg_num=$(printf %02d "$n")
    local out="$OUTPUT_DIR/SEG-${seg_num}_best.mp4"

    echo ""
    echo "  🎥 Generating SEG-${seg_num} (${dur}s)..."

    # Load prompt from canon
    local prompt
    prompt="$(load_prompt "$n")"

    if [[ -z "$prompt" ]]; then
        echo "  ❌ Empty prompt for SEG-${seg_num}" >&2
        exit 1
    fi

    echo "  📝 Prompt: ${prompt:0:80}..."

    # Submit to Veo
    local op res uri
    op="$(submit_veo "$prompt" "$dur" "$seg_num")"
    echo "  📍 Operation: $op"

    # Poll for completion
    res="$(poll_veo "$op")" || {
        echo "  ❌ Polling failed for SEG-${seg_num}" >&2
        echo "$res" >&2
        exit 1
    }

    # Extract GCS URI
    uri="$(jq -r '.response.gcsOutputUri // .response.predictions[0].gcsUri // .predictions[0].gcsUri // empty' <<<""$res")"

    if [[ -z "$uri" ]]; then
        echo "  ❌ No GCS URI in response for SEG-${seg_num}" >&2
        echo "$res" | jq '.' >&2
        exit 1
    fi

    echo "  📥 Downloading from: $uri"
    gcloud storage cp "$uri" "$out" || {
        echo "  ❌ Failed to download SEG-${seg_num}" >&2
        exit 1
    }

    # Verify output
    if [[ ! -s "$out" ]]; then
        echo "  ❌ Output file is empty for SEG-${seg_num}" >&2
        exit 1
    fi

    # Get file info
    local file_size
    file_size=$(du -h "$out" | cut -f1)
    local actual_dur
    actual_dur=$(ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$out" 2>/dev/null || echo "unknown")

    echo "  ✅ SEG-${seg_num} complete: ${actual_dur}s, ${file_size}"

    # Log successful operation
    log_vertex_op "Veo" "generate_segment" "$MODEL_ID" "veo-seg-${seg_num}-$(date +%s)" "success" "200"
}

# DRY RUN CHECK
if [[ "$DRY_RUN" == "true" ]]; then
    echo "🔧 DRY RUN MODE - Creating placeholder videos"

    for n in 1 2 3 4 5 6 7; do
        SEG_NUM=$(printf %02d "$n")
        OUTPUT_FILE="$OUTPUT_DIR/SEG-${SEG_NUM}_best.mp4"

        echo "  Creating placeholder for SEG-${SEG_NUM} (8s)..."
        ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=8" \
            -r 24 \
            -vf "drawtext=text='SEG-${SEG_NUM} PLACEHOLDER':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
            "$OUTPUT_FILE" -y 2>/dev/null

        log_vertex_op "Veo" "generate_segment" "dry-run" "dry-run-seg-${SEG_NUM}"
    done

    # SEG-08 (4s)
    echo "  Creating placeholder for SEG-08 (4s)..."
    ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=4" \
        -r 24 \
        -vf "drawtext=text='SEG-08 PLACEHOLDER':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
        "$OUTPUT_DIR/SEG-08_best.mp4" -y 2>/dev/null

    log_vertex_op "Veo" "generate_segment" "dry-run" "dry-run-seg-08"

    echo "✅ All placeholder videos created"
    exit 0
fi

# PRODUCTION MODE
echo "🎬 PRODUCTION MODE - Generating segments with Vertex AI Veo..."

main() {
    echo ""
    echo "🎬 Generating all segments..."

    # Generate segments 1-7 (8 seconds each)
    for n in 1 2 3 4 5 6 7; do
        gen_segment "$n" 8
    done

    # Generate segment 8 (4 seconds)
    gen_segment 8 4

    echo ""
    echo "✅ All segments generated successfully!"

    # Write summary
    echo ""
    echo "📊 Summary:"
    echo "=========="
    ls -lh "$OUTPUT_DIR"/SEG-*_best.mp4
}

# Run main function
main "$@"