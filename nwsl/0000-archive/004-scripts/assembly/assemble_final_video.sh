#!/bin/bash
# Assemble all 9 segments into final video with watermark
set -e

echo "🎬 ASSEMBLING FINAL VIDEO"
echo "========================"
echo ""

# Create output directory
mkdir -p 060-renders

# Check segments
echo "📊 Checking segments..."
for i in {1..9}; do
    FILE="030-video/shots/SEG-$(printf %02d $i)_best.mp4"
    if [ -f "$FILE" ]; then
        SIZE=$(ls -lh "$FILE" | awk '{print $5}')
        DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FILE")
        echo "  SEG-$(printf %02d $i): ${DURATION}s, $SIZE"
    else
        echo "  SEG-$(printf %02d $i): ❌ MISSING!"
        exit 1
    fi
done

echo ""
echo "📝 Creating concat list..."
# Create concat list
cat > /tmp/concat_list.txt <<EOF
file '$(pwd)/030-video/shots/SEG-01_best.mp4'
file '$(pwd)/030-video/shots/SEG-02_best.mp4'
file '$(pwd)/030-video/shots/SEG-03_best.mp4'
file '$(pwd)/030-video/shots/SEG-04_best.mp4'
file '$(pwd)/030-video/shots/SEG-05_best.mp4'
file '$(pwd)/030-video/shots/SEG-06_best.mp4'
file '$(pwd)/030-video/shots/SEG-07_best.mp4'
file '$(pwd)/030-video/shots/SEG-08_best.mp4'
file '$(pwd)/030-video/shots/SEG-09_best.mp4'
EOF

echo "🎬 Assembling segments..."
ffmpeg -f concat -safe 0 -i /tmp/concat_list.txt \
    -c:v libx264 -crf 23 -preset medium \
    -c:a aac -b:a 128k \
    "060-renders/nwsl_9segments_raw.mp4" -y

echo ""
echo "💧 Adding watermark..."
# Add watermark at 64-68 seconds
ffmpeg -i "060-renders/nwsl_9segments_raw.mp4" \
    -vf "drawtext=text='@asphaltcowb0y':fontsize=24:fontcolor=white@0.7:x=w-tw-10:y=h-th-10:enable='between(t,64,68)'" \
    -c:a copy \
    "060-renders/nwsl_master_16x9.mp4" -y

# Get final stats
FINAL_SIZE=$(ls -lh "060-renders/nwsl_master_16x9.mp4" | awk '{print $5}')
FINAL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "060-renders/nwsl_master_16x9.mp4")

echo ""
echo "✅ VIDEO ASSEMBLY COMPLETE!"
echo "=========================="
echo "Output: 060-renders/nwsl_master_16x9.mp4"
echo "Duration: ${FINAL_DURATION} seconds"
echo "Size: ${FINAL_SIZE}"
echo ""
echo "🎬 Ready to watch!"