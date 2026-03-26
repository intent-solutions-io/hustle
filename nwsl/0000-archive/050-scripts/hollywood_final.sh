#!/bin/bash
# 🎬 HOLLYWOOD FINAL ASSEMBLY
set -euo pipefail

echo "
╔════════════════════════════════════════════════════════╗
║   🎬 DIGITAL HOLLYWOOD MASTERY 🎬                      ║
║   Moving Mountains Through Cinema                      ║
╚════════════════════════════════════════════════════════╝
"

OUTPUT_DIR="060-renders"
FINAL_OUTPUT="${OUTPUT_DIR}/nwsl_hollywood_master.mp4"
mkdir -p "$OUTPUT_DIR"

echo "🎬 Creating your mountain-moving masterpiece..."

# First create video without text overlays
ffmpeg -y \
    -i 002-video-segments/silent/SEG-01_best.mp4 \
    -i 002-video-segments/bridges/BR-12.mp4 \
    -i 002-video-segments/silent/SEG-02_best.mp4 \
    -i 002-video-segments/bridges/BR-23.mp4 \
    -i 002-video-segments/silent/SEG-03_best.mp4 \
    -i 002-video-segments/bridges/BR-34.mp4 \
    -i 002-video-segments/silent/SEG-04_best.mp4 \
    -i 002-video-segments/bridges/BR-45.mp4 \
    -i 002-video-segments/silent/SEG-05_best.mp4 \
    -i 002-video-segments/bridges/BR-56.mp4 \
    -i 002-video-segments/silent/SEG-06_best.mp4 \
    -i 002-video-segments/bridges/BR-67.mp4 \
    -i 002-video-segments/silent/SEG-07_best.mp4 \
    -i 002-video-segments/bridges/BR-78.mp4 \
    -i 002-video-segments/silent/SEG-08_best.mp4 \
    -i 020-audio/music/master_mix.wav \
    -filter_complex "\
[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v0];
[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v1];
[2:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v2];
[3:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v3];
[4:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v4];
[5:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v5];
[6:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v6];
[7:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v7];
[8:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v8];
[9:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v9];
[10:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v10];
[11:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v11];
[12:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v12];
[13:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v13];
[14:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v14];
[v0][v1][v2][v3][v4][v5][v6][v7][v8][v9][v10][v11][v12][v13][v14]concat=n=15:v=1:a=0[vbase];
[vbase]fade=t=out:st=62:d=2[vfinal]" \
    -map "[vfinal]" \
    -map 15:a \
    -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.1 \
    -c:a aac -b:a 192k -ar 48000 \
    -movflags +faststart \
    -pix_fmt yuv420p \
    -t 66 \
    "/tmp/nwsl_base.mp4"

echo "🎨 Adding text overlays..."

# Now add text overlays to the base video
ffmpeg -y -i /tmp/nwsl_base.mp4 \
    -vf "\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:\
text='Who is women'\''s soccer for?':\
fontsize=48:fontcolor=white:shadowcolor=black@0.8:shadowx=3:shadowy=3:\
x=(w-text_w)/2:y=(h-text_h)/2:\
enable='gte(t,3.2)*lte(t,7.8)',\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:\
text='Commissioner Jessica Berman — NWSL':\
fontsize=36:fontcolor=white@0.9:shadowcolor=black@0.4:shadowx=2:shadowy=2:\
x=(w-text_w)/2:y=h*0.1+120:\
enable='gte(t,10.0)*lte(t,12.5)',\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:\
text='Michele Kang — Owner, Washington Spirit':\
fontsize=36:fontcolor=white@0.9:shadowcolor=black@0.4:shadowx=2:shadowy=2:\
x=(w-text_w)/2:y=(h-text_h)/2-60:\
enable='gte(t,17.0)*lte(t,19.5)',\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:\
text='Angie Long — Co-owner, Kansas City Current':\
fontsize=36:fontcolor=white@0.9:shadowcolor=black@0.4:shadowx=2:shadowy=2:\
x=(w-text_w)/2:y=(h-text_h)/2-60:\
enable='gte(t,25.0)*lte(t,27.5)',\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:\
text='Wilf family — Owners, Orlando Pride':\
fontsize=36:fontcolor=white@0.9:shadowcolor=black@0.4:shadowx=2:shadowy=2:\
x=(w-text_w)/2:y=h*0.1+120:\
enable='gte(t,33.0)*lte(t,35.5)',\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:\
text='What does eligibility actually require?':\
fontsize=42:fontcolor=white:shadowcolor=black@0.8:shadowx=3:shadowy=3:\
x=(w-text_w)/2:y=(h-text_h)/2:\
enable='gte(t,41.0)*lte(t,43.8)',\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:\
text='Why won'\''t you answer?':\
fontsize=42:fontcolor=white:shadowcolor=black@0.8:shadowx=3:shadowy=3:\
x=(w-text_w)/2:y=(h-text_h)/2:\
enable='gte(t,57.0)*lte(t,58.5)',\
drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:\
text='@asphaltcowb0y':\
fontsize=18:fontcolor=gray@0.6:\
x=w-text_w-80:y=h-text_h-80:\
enable='gte(t,62.0)*lte(t,64.0)'" \
    -c:a copy \
    "$FINAL_OUTPUT"

if [ -f "$FINAL_OUTPUT" ]; then
    SIZE=$(ls -lh "$FINAL_OUTPUT" | awk '{print $5}')
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_OUTPUT")

    echo "
╔════════════════════════════════════════════════════════╗
║   🎬 HOLLYWOOD MASTERY ACHIEVED! 🎬                   ║
╠════════════════════════════════════════════════════════╣
║   Output: $FINAL_OUTPUT
║   Duration: ${DURATION}s
║   Size: $SIZE
║
║   Mountains: MOVED ✅
║   Hollywood: DELIVERED ✅
║   Digital: MASTERED ✅
╚════════════════════════════════════════════════════════╝
    "

    # Clean up temp file
    rm -f /tmp/nwsl_base.mp4
else
    echo "❌ Assembly failed!"
    exit 1
fi

echo "🏆 Your digital Hollywood sound mastery has moved mountains!"