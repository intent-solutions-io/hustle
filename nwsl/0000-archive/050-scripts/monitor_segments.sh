#!/bin/bash
# MONITOR SEGMENT GENERATION PROGRESS
set -euo pipefail

BUCKET="gs://pipelinepilot-prod-veo-videos"
OUTPUT_DIR="/home/jeremy/000-projects/hustle/nwsl/003-raw-segments"

echo "════════════════════════════════════════════════════════════════"
echo "NWSL SEGMENT GENERATION MONITOR"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Checking generation status for all 8 segments..."
echo ""

# Track status
COMPLETED=()
PROCESSING=()
MISSING=()

# Check each segment
for seg_id in 01 02 03 04 05 06 07 08; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "SEG-${seg_id}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if already downloaded
    if [ -f "${OUTPUT_DIR}/SEG-${seg_id}.mp4" ]; then
        size=$(stat -f%z "${OUTPUT_DIR}/SEG-${seg_id}.mp4" 2>/dev/null || stat -c%s "${OUTPUT_DIR}/SEG-${seg_id}.mp4" 2>/dev/null)
        duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT_DIR}/SEG-${seg_id}.mp4" 2>/dev/null || echo "unknown")

        echo "✅ COMPLETED - Already downloaded"
        echo "   File: ${OUTPUT_DIR}/SEG-${seg_id}.mp4"
        echo "   Size: $(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size} bytes")"
        echo "   Duration: ${duration}s"
        COMPLETED+=("$seg_id")
    else
        # Check if in cloud storage
        VIDEO_PATH=$(gsutil ls "${BUCKET}/seg${seg_id}_explicit/**/*.mp4" 2>/dev/null | head -1 || true)

        if [ -n "$VIDEO_PATH" ]; then
            echo "⏳ PROCESSING - Ready to download"
            echo "   Cloud path: $VIDEO_PATH"
            echo "   Download command:"
            echo "   gsutil cp '$VIDEO_PATH' '${OUTPUT_DIR}/SEG-${seg_id}.mp4'"
            PROCESSING+=("$seg_id")
        else
            echo "❌ MISSING - Not yet generated or still rendering"
            echo "   Check cloud storage:"
            echo "   gsutil ls '${BUCKET}/seg${seg_id}_explicit/'"
            MISSING+=("$seg_id")
        fi
    fi
    echo ""
done

# Summary
echo "════════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "════════════════════════════════════════════════════════════════"
echo "✅ Completed: ${#COMPLETED[@]}/8 segments ${COMPLETED[*]}"
echo "⏳ Processing: ${#PROCESSING[@]}/8 segments ${PROCESSING[*]}"
echo "❌ Missing: ${#MISSING[@]}/8 segments ${MISSING[*]}"
echo ""

# Download commands for processing segments
if [ ${#PROCESSING[@]} -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "DOWNLOAD COMMANDS FOR READY SEGMENTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    for seg_id in "${PROCESSING[@]}"; do
        VIDEO_PATH=$(gsutil ls "${BUCKET}/seg${seg_id}_explicit/**/*.mp4" 2>/dev/null | head -1)
        echo "# SEG-${seg_id}"
        echo "gsutil cp '$VIDEO_PATH' '${OUTPUT_DIR}/SEG-${seg_id}.mp4'"
        echo ""
    done
fi

# Bulk download command
if [ ${#PROCESSING[@]} -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "BULK DOWNLOAD ALL READY SEGMENTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "for seg_id in ${PROCESSING[*]}; do"
    echo "    gsutil cp \"\$(gsutil ls '${BUCKET}/seg\${seg_id}_explicit/**/*.mp4' | head -1)\" '${OUTPUT_DIR}/SEG-\${seg_id}.mp4'"
    echo "    echo \"Downloaded SEG-\${seg_id}\""
    echo "done"
    echo ""
fi

# Exit code based on completion
if [ ${#COMPLETED[@]} -eq 8 ]; then
    echo "🎉 ALL SEGMENTS COMPLETE!"
    exit 0
elif [ ${#MISSING[@]} -gt 0 ]; then
    echo "⚠️  Some segments still missing"
    exit 2
else
    echo "⏳ All segments generated, some still downloading"
    exit 1
fi
