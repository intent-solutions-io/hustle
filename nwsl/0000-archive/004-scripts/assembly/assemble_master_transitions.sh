#!/bin/bash
# Assemble master video with crossfades, bridges, and continuous music
set -e

echo "🎬 OSCAR-WINNING ASSEMBLY WITH TRANSITIONS"
echo "=========================================="
echo ""

# Check all required files
echo "📊 Checking components..."

# Main segments (silent)
for i in {1..9}; do
    FILE="030-video/silent/SEG-$(printf %02d $i)_best.mp4"
    if [ ! -f "$FILE" ]; then
        echo "❌ Missing: $FILE"
        exit 1
    fi
done

# Wait for bridges if needed
if [ ! -f "030-video/silent/BR-12.mp4" ]; then
    echo "⏳ Waiting for bridges to complete..."
    sleep 30
fi

# Create placeholders for missing bridges
for bridge in BR-12 BR-23 BR-34 BR-45 BR-56 BR-67 BR-78; do
    if [ ! -f "030-video/silent/${bridge}.mp4" ]; then
        echo "Creating placeholder for $bridge..."
        ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=2.5" \
            -r 24 -c:v libx264 -pix_fmt yuv420p \
            "030-video/silent/${bridge}.mp4" -y -loglevel error
    fi
done

echo ""
echo "🎵 Preparing audio..."
# Ensure we have the music bed
if [ ! -f "020-audio/music/ambient_base.wav" ]; then
    echo "Creating ambient music bed..."
    mkdir -p 020-audio/music
    ffmpeg -f lavfi -i "anoisesrc=d=120:c=pink:r=48000" \
        -af "lowpass=f=200,volume=0.05" \
        -t 120 020-audio/music/ambient_base.wav -y -loglevel error
fi

echo ""
echo "🔀 Assembling with crossfades..."

# Build the complex filter with all crossfades
# Order: S1, BR-12, S2, BR-23, S3, BR-34, S4, BR-45, S5, BR-56, S6, BR-67, S7, BR-78, S8, S9
# Note: S5→S6 will be a hard cut (0.15s), all others 0.75s dissolves

ffmpeg -y \
  -i "030-video/silent/SEG-01_best.mp4" \
  -i "030-video/silent/BR-12.mp4" \
  -i "030-video/silent/SEG-02_best.mp4" \
  -i "030-video/silent/BR-23.mp4" \
  -i "030-video/silent/SEG-03_best.mp4" \
  -i "030-video/silent/BR-34.mp4" \
  -i "030-video/silent/SEG-04_best.mp4" \
  -i "030-video/silent/BR-45.mp4" \
  -i "030-video/silent/SEG-05_best.mp4" \
  -i "030-video/silent/BR-56.mp4" \
  -i "030-video/silent/SEG-06_best.mp4" \
  -i "030-video/silent/BR-67.mp4" \
  -i "030-video/silent/SEG-07_best.mp4" \
  -i "030-video/silent/BR-78.mp4" \
  -i "030-video/silent/SEG-08_best.mp4" \
  -i "030-video/silent/SEG-09_best.mp4" \
  -i "020-audio/music/ambient_base.wav" \
  -filter_complex "
    [0:v]scale=1920:1080,setsar=1[v0];
    [1:v]scale=1920:1080,setsar=1[v1];
    [2:v]scale=1920:1080,setsar=1[v2];
    [3:v]scale=1920:1080,setsar=1[v3];
    [4:v]scale=1920:1080,setsar=1[v4];
    [5:v]scale=1920:1080,setsar=1[v5];
    [6:v]scale=1920:1080,setsar=1[v6];
    [7:v]scale=1920:1080,setsar=1[v7];
    [8:v]scale=1920:1080,setsar=1[v8];
    [9:v]scale=1920:1080,setsar=1[v9];
    [10:v]scale=1920:1080,setsar=1[v10];
    [11:v]scale=1920:1080,setsar=1[v11];
    [12:v]scale=1920:1080,setsar=1[v12];
    [13:v]scale=1920:1080,setsar=1[v13];
    [14:v]scale=1920:1080,setsar=1[v14];
    [15:v]scale=1920:1080,setsar=1[v15];

    [v0][v1]xfade=transition=fade:duration=0.75:offset=7.25[x01];
    [x01][v2]xfade=transition=fade:duration=0.75:offset=8.75[x02];
    [x02][v3]xfade=transition=fade:duration=0.75:offset=15.25[x03];
    [x03][v4]xfade=transition=fade:duration=0.75:offset=16.75[x04];
    [x04][v5]xfade=transition=fade:duration=0.75:offset=23.25[x05];
    [x05][v6]xfade=transition=fade:duration=0.75:offset=24.75[x06];
    [x06][v7]xfade=transition=fade:duration=0.75:offset=31.25[x07];
    [x07][v8]xfade=transition=fade:duration=0.75:offset=32.75[x08];
    [x08][v9]xfade=transition=fade:duration=0.15:offset=39.85[x09];
    [x09][v10]xfade=transition=fade:duration=0.75:offset=47.25[x10];
    [x10][v11]xfade=transition=fade:duration=0.75:offset=48.75[x11];
    [x11][v12]xfade=transition=fade:duration=0.75:offset=55.25[x12];
    [x12][v13]xfade=transition=fade:duration=0.75:offset=56.75[x13];
    [x13][v14]xfade=transition=fade:duration=0.75:offset=63.25[x14];
    [x14][v15]xfade=transition=fade:duration=0.75:offset=70.25[final];

    [final]drawtext=text='@asphaltcowb0y':
      fontsize=18:fontcolor=gray@0.6:
      x=w-tw-10:y=h-th-10:
      enable='between(t,75,78)'[vout];

    [16:a]atrim=0:78,asetpts=N/SR/TB,volume=0.8[aout]
  " \
  -map "[vout]" -map "[aout]" \
  -r 24 -c:v libx264 -crf 18 -preset medium \
  -c:a aac -b:a 128k \
  -pix_fmt yuv420p \
  -shortest \
  "060-renders/nwsl_master_transitions.mp4"

echo ""
echo "✅ MASTER ASSEMBLED WITH TRANSITIONS!"
echo "====================================="

# Get stats
if [ -f "060-renders/nwsl_master_transitions.mp4" ]; then
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "060-renders/nwsl_master_transitions.mp4")
    SIZE=$(ls -lh "060-renders/nwsl_master_transitions.mp4" | awk '{print $5}')

    echo "Output: 060-renders/nwsl_master_transitions.mp4"
    echo "Duration: ${DURATION} seconds"
    echo "Size: ${SIZE}"
    echo ""
    echo "🏆 Ready for viewing!"
else
    echo "❌ Assembly failed!"
fi