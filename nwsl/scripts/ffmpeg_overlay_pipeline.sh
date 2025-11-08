#!/bin/bash
# ffmpeg_overlay_pipeline.sh
# Text overlay pipeline for "Why Won't They Answer?" documentary
# IMPORTANT: All dollar amounts must be escaped with backslash (\$30 million)

# Configuration
INPUT_VIDEO="final_merged.mp4"
OUTPUT_VIDEO="final_with_overlays.mp4"
FONT="Arial"
FONTSIZE=42
FONTCOLOR="white"
BOX_COLOR="black@0.7"
BOX_PADDING=10

# Text overlay timings from master brief
# Each overlay: start_time, duration, text content
# CRITICAL: Escape all dollar signs to prevent shell variable expansion!

ffmpeg -i "$INPUT_VIDEO" -vf "
drawtext=text='Commissioner Jessica Berman':
  enable='between(t,10,13)':
  fontfile=$FONT:fontsize=$FONTSIZE:fontcolor=$FONTCOLOR:
  box=1:boxcolor=$BOX_COLOR:boxborderw=$BOX_PADDING:
  x=(w-text_w)/2:y=h-150,

drawtext=text='Spent \$30 million+ on women'\''s soccer':
  enable='between(t,20,22)':
  fontfile=$FONT:fontsize=$FONTSIZE:fontcolor=$FONTCOLOR:
  box=1:boxcolor=$BOX_COLOR:boxborderw=$BOX_PADDING:
  x=(w-text_w)/2:y=h-150,

drawtext=text='Built a \$117 million stadium for women':
  enable='between(t,28,30)':
  fontfile=$FONT:fontsize=$FONTSIZE:fontcolor=$FONTCOLOR:
  box=1:boxcolor=$BOX_COLOR:boxborderw=$BOX_PADDING:
  x=(w-text_w)/2:y=h-150,

drawtext=text='@asphaltcowb0y':
  fontfile=$FONT:fontsize=24:fontcolor=$FONTCOLOR:
  alpha=0.8:x=w-200:y=30
" -codec:a copy "$OUTPUT_VIDEO"

echo "Overlay pipeline complete: $OUTPUT_VIDEO"