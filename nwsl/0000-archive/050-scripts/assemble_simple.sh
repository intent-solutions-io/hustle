#!/bin/bash
# SIMPLE ASSEMBLY - GET IT DONE NOW!
set -euo pipefail

echo "🎬 SIMPLE ASSEMBLY - 8 SEGMENTS WITH BASIC OVERLAYS"
echo "===================================================="
echo ""

# Strip audio from all segments
echo "🔇 Preparing silent segments..."
for i in {1..8}; do
    ffmpeg -y -i segments/SEG-0${i}_FINAL.mp4 -c:v copy -an segments/SEG-0${i}_silent.mp4 2>/dev/null
done

# Create simple dynamic audio
echo "🎵 Creating simple audio track..."
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=66" \
    -af "volume=0.2,afade=t=in:st=0:d=2,afade=t=out:st=64:d=2" \
    audio/simple_audio.wav 2>/dev/null

# Assembly with crossfades - NO COMPLEX OVERLAYS YET
echo "🎬 Assembling video..."

ffmpeg -y \
    -i segments/SEG-01_silent.mp4 \
    -i segments/SEG-02_silent.mp4 \
    -i segments/SEG-03_silent.mp4 \
    -i segments/SEG-04_silent.mp4 \
    -i segments/SEG-05_silent.mp4 \
    -i segments/SEG-06_silent.mp4 \
    -i segments/SEG-07_silent.mp4 \
    -i segments/SEG-08_silent.mp4 \
    -i audio/simple_audio.wav \
    -filter_complex "
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
[t34][v5]xfade=transition=fade:duration=0.8:offset=36[t45];
[t45][v6]xfade=transition=fade:duration=0.8:offset=43.2[t56];
[t56][v7]xfade=transition=fade:duration=0.8:offset=50.4[video];

[video]drawtext=text='Commissioner Jessica Berman':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h/2-100:enable='between(t,10,12.5)',
drawtext=text='Michele Kang - Washington Spirit':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h/2-100:enable='between(t,17,19.5)',
drawtext=text='Angie Long - Kansas City Current':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h/2-100:enable='between(t,25,27.5)',
drawtext=text='The Wilf Family - Orlando Pride':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h/2-100:enable='between(t,33,34.5)',
drawtext=text='Why no answer?':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h/2:enable='between(t,57,58.5)',
drawtext=text='@asphaltcowb0y':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=28:fontcolor=white@0.8:x=w-tw-50:y=h-th-50:enable='between(t,62,64)'[vfinal];

[vfinal]tpad=stop_mode=clone:stop_duration=2[vout]" \
    -map "[vout]" \
    -map "8:a" \
    -c:v libx264 -preset fast -crf 22 \
    -c:a aac -b:a 192k \
    -pix_fmt yuv420p \
    -movflags +faststart \
    060-renders/NWSL_SIMPLE_MASTER.mp4

if [ -f "060-renders/NWSL_SIMPLE_MASTER.mp4" ]; then
    echo ""
    echo "✅ VIDEO CREATED SUCCESSFULLY!"
    echo "=============================="
    echo "📹 Output: 060-renders/NWSL_SIMPLE_MASTER.mp4"

    SIZE=$(ls -lh 060-renders/NWSL_SIMPLE_MASTER.mp4 | awk '{print $5}')
    echo "📊 Size: $SIZE"
    echo ""
    echo "🎉 AFTER 3 DAYS - WE HAVE A VIDEO WITH:"
    echo "   ✅ All 8 segments with SOCCER content"
    echo "   ✅ Key NWSL figure overlays"
    echo "   ✅ Smooth transitions"
    echo "   ✅ @asphaltcowb0y watermark"
else
    echo "❌ Assembly failed"
    exit 1
fi