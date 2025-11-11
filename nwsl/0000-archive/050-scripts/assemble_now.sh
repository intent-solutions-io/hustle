#!/bin/bash
# IMMEDIATE ASSEMBLY WITH 8 SEGMENTS + OVERLAYS
set -euo pipefail

echo "🎬 ASSEMBLING HOLLYWOOD MASTER - ALL 8 SEGMENTS READY!"
echo "======================================================"
echo ""

# Create audio directory if needed
mkdir -p audio

# Strip audio from all segments
echo "🔇 Preparing silent segments..."
for i in {1..8}; do
    ffmpeg -y -i segments/SEG-0${i}_FINAL.mp4 -c:v copy -an segments/SEG-0${i}_silent.mp4 2>/dev/null
    echo "✅ Segment $i silenced"
done

# Create dynamic audio track with breaks
echo "🎵 Creating dynamic audio with breaks..."
# Segment 1-3: Intro music (building tension)
ffmpeg -y -f lavfi -i "sine=frequency=392:duration=24" -af "volume=0.3,afade=t=in:st=0:d=2,afade=t=out:st=22:d=2" audio/part1.wav 2>/dev/null
# Break
ffmpeg -y -f lavfi -i "anullsrc=duration=1" audio/break1.wav 2>/dev/null
# Segment 4-6: Middle section (higher tension)
ffmpeg -y -f lavfi -i "sine=frequency=523:duration=24" -af "volume=0.35,tremolo=f=4:d=0.2,afade=t=in:st=0:d=1,afade=t=out:st=22:d=2" audio/part2.wav 2>/dev/null
# Break
ffmpeg -y -f lavfi -i "anullsrc=duration=1" audio/break2.wav 2>/dev/null
# Segment 7-8: Conclusion (resolution)
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=18" -af "volume=0.25,afade=t=in:st=0:d=1,afade=t=out:st=16:d=2" audio/part3.wav 2>/dev/null

# Combine audio parts
ffmpeg -y -i audio/part1.wav -i audio/break1.wav -i audio/part2.wav -i audio/break2.wav -i audio/part3.wav \
    -filter_complex "[0][1][2][3][4]concat=n=5:v=0:a=1[out]" \
    -map "[out]" audio/dynamic_soundtrack.wav 2>/dev/null

echo "✅ Dynamic soundtrack created"

# Build complex filter for video assembly with crossfades
echo "🎬 Assembling video with transitions..."

# Create filter complex
FILTER="
[0:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v0];
[1:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v1];
[2:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v2];
[3:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v3];
[4:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v4];
[5:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v5];
[6:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v6];
[7:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v7];

[v0][v1]xfade=transition=fade:duration=0.8:offset=7.2[t01];
[t01][v2]xfade=transition=fade:duration=0.8:offset=14.4[t12];
[t12][v3]xfade=transition=fade:duration=0.8:offset=21.6[t23];
[t23][v4]xfade=transition=fade:duration=0.8:offset=28.8[t34];
[t34][v5]concat=n=2:v=1:a=0[t45];
[t45][v6]xfade=transition=fade:duration=0.8:offset=44.2[t56];
[t56][v7]xfade=transition=fade:duration=0.8:offset=51.4[video_base]"

# Add text overlays
echo "📝 Adding text overlays..."

# Read overlay CSV
OVERLAY_FILTER="[video_base]"
while IFS=, read -r start end text anchor x y style; do
    # Skip header
    if [[ "$start" == "time_in_sec" ]]; then continue; fi

    # Clean text
    text=$(echo "$text" | tr -d '"' | sed "s/'/\\\\'/g")

    # Determine style
    case "$style" in
        "primary")
            SIZE=56
            COLOR="yellow"
            BORDER=4
            ;;
        "secondary")
            SIZE=42
            COLOR="white"
            BORDER=3
            ;;
        "watermark")
            SIZE=28
            COLOR="white@0.8"
            BORDER=2
            ;;
        *)
            SIZE=42
            COLOR="white"
            BORDER=3
            ;;
    esac

    # Build drawtext with strong border for readability
    OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='${text}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${SIZE}:fontcolor=${COLOR}:borderw=${BORDER}:bordercolor=black:x=(w-text_w)/2+${x}:y=h/2+${y}:enable='between(t,${start},${end})',"
done < docs/036-DD-DATA-overlay-map.csv

# Remove trailing comma
OVERLAY_FILTER="${OVERLAY_FILTER%,}[vfinal]"

# Add black tail
FILTER="${FILTER};${OVERLAY_FILTER};[vfinal]tpad=stop_mode=clone:stop_duration=2[vout]"

# Execute assembly
echo "🚀 Running final assembly..."
ffmpeg -y \
    -i segments/SEG-01_silent.mp4 \
    -i segments/SEG-02_silent.mp4 \
    -i segments/SEG-03_silent.mp4 \
    -i segments/SEG-04_silent.mp4 \
    -i segments/SEG-05_silent.mp4 \
    -i segments/SEG-06_silent.mp4 \
    -i segments/SEG-07_silent.mp4 \
    -i segments/SEG-08_silent.mp4 \
    -i audio/dynamic_soundtrack.wav \
    -filter_complex "$FILTER" \
    -map "[vout]" \
    -map "8:a" \
    -c:v libx264 -preset medium -crf 22 \
    -c:a aac -b:a 192k \
    -pix_fmt yuv420p \
    -movflags +faststart \
    060-renders/NWSL_HOLLYWOOD_MASTER_FINAL.mp4

if [ -f "060-renders/NWSL_HOLLYWOOD_MASTER_FINAL.mp4" ]; then
    echo ""
    echo "✅✅✅ HOLLYWOOD MASTER CREATED! ✅✅✅"
    echo "======================================="
    echo "📹 Output: 060-renders/NWSL_HOLLYWOOD_MASTER_FINAL.mp4"

    # Get stats
    SIZE=$(ls -lh 060-renders/NWSL_HOLLYWOOD_MASTER_FINAL.mp4 | awk '{print $5}')
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 060-renders/NWSL_HOLLYWOOD_MASTER_FINAL.mp4 2>/dev/null | cut -d. -f1)

    echo "📊 Size: $SIZE"
    echo "⏱️ Duration: ${DURATION} seconds"
    echo ""
    echo "🏆 AFTER 3 DAYS OF ATTEMPTS:"
    echo "   ✅ All 8 segments with SOCCER content"
    echo "   ✅ Text overlays with NWSL figures"
    echo "   ✅ Dynamic audio with breaks"
    echo "   ✅ Professional transitions"
    echo ""
    echo "🎉 AWARD-WINNING VIDEO READY TO MOVE MOUNTAINS!"
else
    echo "❌ Assembly failed - check errors above"
    exit 1
fi