#!/usr/bin/env bash
# ffmpeg_assembly_9seg.sh - Final assembly with 9 segments (8 Veo + 1 end card)
set -euo pipefail

# Source dependencies
source ./gate.sh

echo "🎬 Final Assembly - 9 Segment Documentary"
echo "=========================================="

# Set paths
VIDEO_DIR="030-video/shots"
AUDIO_DIR="020-audio/music"
OVERLAY_FILE="040-overlays/overlays_16x9.ass"
OUTPUT_DIR="060-renders/final"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Step 1: Create SEG-09 end card (4.0s black with overlay text)
echo "📋 Creating SEG-09 end card..."
ffmpeg -y -f lavfi -i "color=c=black:s=1920x1080:d=4:r=24" \
    -pix_fmt yuv420p \
    "$VIDEO_DIR/SEG-09_endcard.mp4" 2>/dev/null || {
        echo "❌ Failed to create end card" >&2
        exit 1
    }

# Step 2: Extend audio to ~64 seconds with echo fade
echo "🎵 Extending audio to 64 seconds..."
if [[ -f "$AUDIO_DIR/master_mix.wav" ]]; then
    ffmpeg -y -i "$AUDIO_DIR/master_mix.wav" -filter_complex \
        "[0:a]atrim=end=60,asetpts=N/SR/TB[a];
         [0:a]atrim=start=60,asetpts=N/SR/TB,aecho=0.8:0.6:60|120:0.25|0.18,afade=t=out:st=60:d=4[b];
         [a][b]concat=n=2:v=0:a=1[out]" \
        -map "[out]" \
        "$AUDIO_DIR/master_mix_plus.wav" 2>/dev/null || {
            echo "❌ Failed to extend audio" >&2
            exit 1
        }
    echo "✅ Audio extended to 64 seconds"
else
    echo "❌ Audio file not found: $AUDIO_DIR/master_mix.wav" >&2
    exit 1
fi

# Step 3: Verify all 8 Veo segments exist
echo "🔍 Verifying video segments..."
MISSING_SEGMENTS=false
for n in {01..08}; do
    FILE="$VIDEO_DIR/SEG-${n}_best.mp4"
    if [[ ! -f "$FILE" ]]; then
        echo "  ❌ Missing: SEG-${n}"
        MISSING_SEGMENTS=true
    else
        SIZE=$(stat -c%s "$FILE" 2>/dev/null || stat -f%z "$FILE" 2>/dev/null || echo "0")
        if [[ "$SIZE" -lt 1048576 ]]; then  # 1MB threshold
            echo "  ⚠️ SEG-${n} is too small ($(numfmt --to=iec-i --suffix=B $SIZE))"
            MISSING_SEGMENTS=true
        else
            echo "  ✅ SEG-${n} ($(numfmt --to=iec-i --suffix=B $SIZE))"
        fi
    fi
done

if [[ "$MISSING_SEGMENTS" == "true" ]]; then
    echo "❌ Cannot proceed - missing or invalid segments" >&2
    exit 1
fi

# Step 4: Create concat list
echo "📝 Creating concatenation list..."
CONCAT_LIST=$(mktemp --suffix=.txt)
for n in {01..08}; do
    echo "file '$PWD/$VIDEO_DIR/SEG-${n}_best.mp4'" >> "$CONCAT_LIST"
done
echo "file '$PWD/$VIDEO_DIR/SEG-09_endcard.mp4'" >> "$CONCAT_LIST"

echo "Concatenation order:"
cat "$CONCAT_LIST"

# Step 5: Check for overlay file
if [[ ! -f "$OVERLAY_FILE" ]]; then
    echo "⚠️ Warning: Overlay file not found: $OVERLAY_FILE"
    echo "  Run overlay_sync.sh and overlay_build.sh first"
    OVERLAY_FILTER=""
else
    echo "✅ Using overlays: $OVERLAY_FILE"
    OVERLAY_FILTER="ass=$OVERLAY_FILE,"
fi

# Step 6: Final assembly with overlays
echo "🎬 Assembling final video with overlays..."
ffmpeg -y \
    -f concat -safe 0 -i "$CONCAT_LIST" \
    -i "$AUDIO_DIR/master_mix_plus.wav" \
    -filter_complex "[0:v]${OVERLAY_FILTER}scale=1920:1080,fps=24[v]" \
    -map "[v]" -map 1:a \
    -c:v libx264 -crf 18 -preset medium \
    -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ar 48000 \
    -movflags +faststart \
    "$OUTPUT_DIR/master_16x9.mp4" 2>&1 | grep -E "(frame=|speed=|time=|size=)" || true

# Clean up temp file
rm -f "$CONCAT_LIST"

# Step 7: Verify output
if [[ ! -f "$OUTPUT_DIR/master_16x9.mp4" ]]; then
    echo "❌ Failed to create output video" >&2
    exit 1
fi

# Get file info
FILE_SIZE=$(du -h "$OUTPUT_DIR/master_16x9.mp4" | cut -f1)
DURATION=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_DIR/master_16x9.mp4" 2>/dev/null || echo "unknown")
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate \
    -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_DIR/master_16x9.mp4" 2>/dev/null || echo "unknown")

echo ""
echo "✅ SUCCESS: Documentary assembled!"
echo "=================================="
echo "📄 Output: $OUTPUT_DIR/master_16x9.mp4"
echo "📊 Size: $FILE_SIZE"
echo "⏱️ Duration: ${DURATION}s"
echo "🎞️ Frame rate: $FPS"

# Acceptance check
if [[ $(stat -c%s "$OUTPUT_DIR/master_16x9.mp4" 2>/dev/null || stat -f%z "$OUTPUT_DIR/master_16x9.mp4") -lt 52428800 ]]; then
    echo "⚠️ Warning: Output file is smaller than 50MB - quality may be compromised"
fi

echo ""
echo "🎯 Next steps:"
echo "  1. Review the video for quality"
echo "  2. Check overlay timing and positioning"
echo "  3. Verify @asphaltcowb0y appears at 01:00-01:04"
echo "  4. Upload to production if approved"