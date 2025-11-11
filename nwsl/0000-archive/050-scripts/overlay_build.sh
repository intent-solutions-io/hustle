#!/usr/bin/env bash
# overlay_build.sh - Apply text overlays to video segments
set -euo pipefail

# Source dependencies
source ./gate.sh

echo "🎬 Overlay Build - Applying Text to Video Segments"
echo "==================================================="

# Set paths
OVERLAY_FILE="040-overlays/overlays_16x9.ass"
VIDEO_DIR="030-video/shots"
OUTPUT_DIR="050-intermediate"
DRY_RUN="${DRY_RUN:-false}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check prerequisites
if [[ ! -f "$OVERLAY_FILE" ]]; then
    echo "❌ [FATAL] Missing overlay file: $OVERLAY_FILE" >&2
    echo "  Run overlay_sync.sh first!" >&2
    exit 1
fi

# Check for video segments
VIDEO_COUNT=$(ls -1 "$VIDEO_DIR"/SEG-*_best.mp4 2>/dev/null | wc -l)
if [[ "$VIDEO_COUNT" -eq 0 ]]; then
    echo "❌ [FATAL] No video segments found in $VIDEO_DIR" >&2
    exit 1
fi

echo "✅ Found $VIDEO_COUNT video segments"
echo "📄 Using overlay file: $OVERLAY_FILE"

# Dry run check
if [[ "$DRY_RUN" == "true" ]]; then
    echo "🔧 DRY RUN MODE - Copying segments without overlays"

    for seg in "$VIDEO_DIR"/SEG-*_best.mp4; do
        base=$(basename "$seg" .mp4)
        cp "$seg" "$OUTPUT_DIR/${base}_with_overlay.mp4"
        echo "  📋 Copied $base (no overlay in dry run)"
    done

    echo "✅ Dry run complete"
    exit 0
fi

# Process each segment
echo ""
echo "🎨 Applying overlays to segments..."

for seg in "$VIDEO_DIR"/SEG-*_best.mp4; do
    base=$(basename "$seg" .mp4)
    seg_num="${base:4:2}"  # Extract segment number
    output="$OUTPUT_DIR/${base}_with_overlay.mp4"

    echo "  Processing SEG-${seg_num}..."

    # Apply overlay using ffmpeg
    ffmpeg -i "$seg" \
        -vf "ass=$OVERLAY_FILE" \
        -c:v libx264 \
        -preset medium \
        -crf 23 \
        -c:a copy \
        -y \
        "$output" 2>/dev/null || {
            echo "    ❌ Failed to apply overlay to SEG-${seg_num}" >&2
            exit 1
        }

    # Verify output
    if [[ ! -s "$output" ]]; then
        echo "    ❌ Output file is empty for SEG-${seg_num}" >&2
        exit 1
    fi

    # Get file size
    size=$(du -h "$output" | cut -f1)
    echo "    ✅ SEG-${seg_num} complete (${size})"
done

# Summary
echo ""
echo "📊 Summary:"
echo "=========="
ls -lh "$OUTPUT_DIR"/*_with_overlay.mp4 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

echo ""
echo "✨ All segments have overlays applied!"
echo "✅ Ready for ffmpeg_overlay_pipeline.sh (final assembly)"