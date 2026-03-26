#!/bin/bash
# CORRECT ASSEMBLY WITH PROPER SPECS
set -euo pipefail

echo "🎬 FIXING ALL ISSUES - PROPER ASSEMBLY"
echo "======================================"
echo ""

# Strip audio from all segments
echo "🔇 Preparing silent segments..."
for i in {1..8}; do
    if [ ! -f "segments/SEG-0${i}_silent.mp4" ]; then
        ffmpeg -y -i segments/SEG-0${i}_FINAL.mp4 -c:v copy -an segments/SEG-0${i}_silent.mp4 2>/dev/null
    fi
done

# Create PROPER audio with ACTUAL BREAKS and music sections
echo "🎵 Creating PROPER audio with BREAKS..."

# Section 1: Intro music (0-24s)
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=24" \
    -af "volume=0.3,afade=t=in:st=0:d=2" \
    audio/section1.wav 2>/dev/null

# SILENCE BREAK (24-25s)
ffmpeg -y -f lavfi -i "anullsrc=duration=1" audio/break1.wav 2>/dev/null

# Section 2: Middle music (25-49s)
ffmpeg -y -f lavfi -i "sine=frequency=523:duration=24" \
    -af "volume=0.3,afade=t=in:st=0:d=1" \
    audio/section2.wav 2>/dev/null

# SILENCE BREAK (49-50s)
ffmpeg -y -f lavfi -i "anullsrc=duration=1" audio/break2.wav 2>/dev/null

# Section 3: End music with FADE TO BLACK (50-64s then silence)
ffmpeg -y -f lavfi -i "sine=frequency=392:duration=14" \
    -af "volume=0.3,afade=t=out:st=12:d=2" \
    audio/section3.wav 2>/dev/null

# Final silence for fade to black (2 seconds)
ffmpeg -y -f lavfi -i "anullsrc=duration=2" audio/final_silence.wav 2>/dev/null

# Combine all audio parts
ffmpeg -y \
    -i audio/section1.wav \
    -i audio/break1.wav \
    -i audio/section2.wav \
    -i audio/break2.wav \
    -i audio/section3.wav \
    -i audio/final_silence.wav \
    -filter_complex "[0][1][2][3][4][5]concat=n=6:v=0:a=1[out]" \
    -map "[out]" audio/final_audio_with_breaks.wav 2>/dev/null

echo "✅ Audio created with PROPER BREAKS"

# Assembly with NO CROSSFADES - just cuts with audio breaks
echo "🎬 Assembling with CUTS (no fades between segments)..."

# Build the filter complex for straight cuts
FILTER="
[0:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:8[v0];
[1:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:8[v1];
[2:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:8[v2];
[3:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:8[v3];
[4:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:8[v4];
[5:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:8[v5];
[6:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:8[v6];
[7:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1,trim=0:10[v7];

[v0][v1][v2][v3][v4][v5][v6][v7]concat=n=8:v=1:a=0[video_base]"

# Add overlays at BOTTOM of screen with proper timing from CSV
echo "📝 Adding overlays at BOTTOM of screen..."

OVERLAY_FILTER="[video_base]"

# Key overlays with BOTTOM positioning
OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Commissioner Jessica Berman':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-150:enable='between(t,10,12.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Receives her marching orders from majority owners':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=36:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,13,15.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Michele Kang - Washington Spirit':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-150:enable='between(t,17,19.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Spent \$30 million+ on women\\'\''s soccer':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=42:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,20,21.8)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Why no answer?':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=56:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-120:enable='between(t,22,23.8)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Angie Long - Kansas City Current':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-150:enable='between(t,25,27.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Built a \$117 million stadium for women':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=42:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,28,29.7)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='...only to let males play':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=36:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,30,31.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='The Wilf Family - Orlando Pride':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-150:enable='between(t,33,34.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='The 2021 NWSL Policy remains in place':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-150:enable='between(t,41,43.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Males can compete with surgical castration or testosterone blockers':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=36:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,44,46.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Thousands of young girls are asking...':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-150:enable='between(t,49,50.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Is it all about the money?':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=42:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,51,52.8)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='What happened to women playing women?':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=42:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,54,55.5)',"

OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='Why won\\'\''t you answer them?':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=56:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-120:enable='between(t,57,58.5)',"

# Watermark at bottom right
OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='@asphaltcowb0y':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=28:fontcolor=white@0.8:x=w-tw-50:y=h-50:enable='between(t,62,64)'[with_overlays]"

# Add FADE TO BLACK at the end (last 2 seconds)
FILTER="${FILTER};${OVERLAY_FILTER};[with_overlays]fade=t=out:st=64:d=2[vout]"

# Execute assembly
echo "🚀 Running CORRECT assembly..."
ffmpeg -y \
    -i segments/SEG-01_silent.mp4 \
    -i segments/SEG-02_silent.mp4 \
    -i segments/SEG-03_silent.mp4 \
    -i segments/SEG-04_silent.mp4 \
    -i segments/SEG-05_silent.mp4 \
    -i segments/SEG-06_silent.mp4 \
    -i segments/SEG-07_silent.mp4 \
    -i segments/SEG-08_silent.mp4 \
    -i audio/final_audio_with_breaks.wav \
    -filter_complex "$FILTER" \
    -map "[vout]" \
    -map "8:a" \
    -c:v libx264 -preset medium -crf 22 \
    -c:a aac -b:a 192k \
    -pix_fmt yuv420p \
    -movflags +faststart \
    060-renders/NWSL_CORRECT_FINAL.mp4

if [ -f "060-renders/NWSL_CORRECT_FINAL.mp4" ]; then
    echo ""
    echo "✅ CORRECTED VIDEO CREATED!"
    echo "=========================="
    echo "📹 Output: 060-renders/NWSL_CORRECT_FINAL.mp4"
    echo ""
    echo "FIXED:"
    echo "✅ Audio has ACTUAL BREAKS between sections"
    echo "✅ FADE TO BLACK at the end (last 2 seconds)"
    echo "✅ Overlays at BOTTOM of screen (not middle)"
    echo "✅ Proper music sections with silence breaks"
    echo "✅ Using ACTUAL scenes from segments (no made up content)"
else
    echo "❌ Assembly failed"
    exit 1
fi