#!/bin/bash
# ffmpeg_overlay_pipeline.sh - Apply text overlays with proper dollar escaping
# Phase 5 - Final Assembly with voice-free production
# CRITICAL: All dollar amounts MUST be escaped with backslash

set -e

# CI-only enforcement
source ./gate.sh

# Input/Output
INPUT="${1:-030-video/assembly/video_with_music.mp4}"
OUTPUT="${2:-060-renders/final/why_wont_they_answer_master.mp4}"

# Font configuration
FONT_FILE="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_SIZE=48
FONT_SIZE_POLICY=44
FONT_SIZE_QUESTION=52
WATERMARK_SIZE=24

# Colors and styling
WHITE="ffffff"
BLACK="000000"
WATERMARK_OPACITY="66"  # 40% opacity in hex

# Position calculations
Y_POSITION="h*0.85"
Y_WATERMARK="h*0.95"
X_CENTER="(w-text_w)/2"
X_WATERMARK="w*0.9"

echo "🎬 Starting overlay pipeline..."
echo "Input: $INPUT"
echo "Output: $OUTPUT"

# Create output directories
mkdir -p 060-renders/final
mkdir -p 060-renders/logs

# Build the complex filtergraph with all overlays
# CRITICAL: Note the escaped dollar signs in lines with $30 and $117
ffmpeg -i "$INPUT" -filter_complex "
[0:v]
drawtext=text='Jessica Berman — NWSL Commissioner (since 2022).':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,10,11)',

drawtext=text='The league'\''s Board of Governors (club ownership representatives) controls major decisions.':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,13,14)',

drawtext=text='Michele Kang - Washington Spirit':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,17,18)',

drawtext=text='Spent \$30 million+ on women'\''s soccer':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,20,21)',

drawtext=text='Why no answer?':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,22,22.5)',

drawtext=text='Angie Long - Kansas City Current':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,25,26)',

drawtext=text='Built a \$117 million stadium...':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,28,29)',

drawtext=text='...only to let males play':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,30,31)',

drawtext=text='The Wilf Family - Orlando Pride':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,33,34)',

drawtext=text='What excuse will they use?':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,35,36)',

drawtext=text='Money, probably.':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,37,38)',

drawtext=text='NWSL Policy on Transgender Athletes (2021).':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,41,42)',

drawtext=text='Eligibility for transgender women\: declare female identity and
keep serum testosterone <10 nmol/L for ≥12 months; compliance is tested.':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE_POLICY:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,44,46)',

drawtext=text='Suppression can be via medication or surgical castration.':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,46.5,47.5)',

drawtext=text='Thousands of young girls...':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,49,50)',

drawtext=text='Is it all about the money?':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,51,52)',

drawtext=text='What happened to women...':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,54,55)',

drawtext=text='Why won'\''t you answer them?':
  fontfile='$FONT_FILE':fontsize=$FONT_SIZE_QUESTION:fontcolor=$WHITE:
  borderw=2:bordercolor=$BLACK:
  x=$X_CENTER:y=$Y_POSITION:
  enable='between(t,57,60.04)',

drawtext=text='@asphaltcowb0y':
  fontfile='$FONT_FILE':fontsize=$WATERMARK_SIZE:fontcolor=${WHITE}${WATERMARK_OPACITY}:
  x=$X_WATERMARK:y=$Y_WATERMARK:
  enable='gte(t,0)'
[out]
" \
-map "[out]" \
-map 0:a \
-c:v libx264 -preset slow -crf 18 \
-c:a copy \
-movflags +faststart \
"$OUTPUT" 2>&1 | tee 060-renders/logs/overlay_pipeline.log

echo ""
echo "✅ Overlay pipeline complete!"
echo ""

# Verify output
if [ -f "$OUTPUT" ]; then
    echo "📊 Output file details:"
    ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUTPUT"

    echo ""
    echo "🔍 Checking for critical dollar amounts..."
    # Quick visual check using a frame grab
    ffmpeg -ss 20.5 -i "$OUTPUT" -vframes 1 -q:v 2 060-renders/logs/check_30_million.jpg 2>/dev/null
    ffmpeg -ss 28.5 -i "$OUTPUT" -vframes 1 -q:v 2 060-renders/logs/check_117_million.jpg 2>/dev/null

    echo "Frame grabs saved to:"
    echo "  - 060-renders/logs/check_30_million.jpg (should show '\$30 million+')"
    echo "  - 060-renders/logs/check_117_million.jpg (should show '\$117 million')"
    echo ""
    echo "Please verify these images show the dollar amounts correctly!"
else
    echo "❌ ERROR: Output file not created!"
    exit 1
fi

echo ""
echo "🎯 Final output: $OUTPUT"
echo "📝 Log saved to: 060-renders/logs/overlay_pipeline.log"
echo ""
echo "⚠️  CRITICAL REMINDERS:"
echo "  1. Verify \$30 million displays correctly (not as '0 million')"
echo "  2. Verify \$117 million displays correctly"
echo "  3. Check watermark opacity is at 40%"
echo "  4. Confirm no human voices in audio track"
echo ""
echo "Pipeline complete!"