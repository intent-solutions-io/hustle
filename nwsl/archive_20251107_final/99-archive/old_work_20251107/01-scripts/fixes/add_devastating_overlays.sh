#!/bin/bash
# Add devastating text overlays with names and amounts to merged documentary
# Fixes FFmpeg syntax error and adds all required text

echo "📝 ADDING DEVASTATING TEXT OVERLAYS"
echo "===================================="

# Find the merged documentary
MERGED_VIDEO="SMART_DOC_20251107_201335/SMART_DOC_20251107_201335/merged_documentary.mp4"

if [[ ! -f "$MERGED_VIDEO" ]]; then
    echo "❌ Merged video not found at $MERGED_VIDEO"
    exit 1
fi

echo "✅ Found merged video: $MERGED_VIDEO"
echo "🎬 Duration: 56 seconds"
echo ""
echo "Adding text overlays:"
echo "• Commissioner Jessica Berman"
echo "• Michele Kang - Washington Spirit ($30M+)"
echo "• Angie Long - Kansas City Current ($117M stadium)"
echo "• The Wilf Family - Orlando Pride"
echo "• The 2021 NWSL Policy"
echo "• #StopTheInsanity"
echo "• @asphaltcowb0y"
echo ""

# Create the output filename
OUTPUT_VIDEO="FINAL_DEVASTATION_60s.mp4"

# Apply all text overlays with proper timing
# Based on the segment mapping and Lyria prompt timing
ffmpeg -i "$MERGED_VIDEO" \
    -vf "
    drawtext=text='WHY WON'\''T THEY ANSWER?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,2,6)':shadowcolor=black@0.9:shadowx=4:shadowy=4,

    drawtext=text='Commissioner Jessica Berman':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,10,13)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Receives her marching orders from majority owners':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=40:x=(w-text_w)/2:y=h-100:enable='between(t,13,15)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Michele Kang - Washington Spirit':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,15,18)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Spent \$30 million+ on women'\''s soccer':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,18,20)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Why no answer?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=red:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,20,22)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='Angie Long - Kansas City Current':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,22,26)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Built a \$117 million stadium for women':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,26,28)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='...only to let males play':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=red:fontsize=48:x=(w-text_w)/2:y=h-60:enable='between(t,28,30)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='The Wilf Family - Orlando Pride':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,30,33)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='What excuse will they use?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,33,35)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Money\, probably.':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,35,37)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='The 2021 NWSL Policy remains in place':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,37,41)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Males can compete with castration or testosterone blockers':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=red:fontsize=40:x=(w-text_w)/2:y=h-80:enable='between(t,41,45)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Thousands of young girls are asking...':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,45,49)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Is it all about the money?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,49,52)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='What happened to women playing women?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,52,56)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='@asphaltcowb0y':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=28:x=w-text_w-25:y=h-text_h-25:shadowcolor=black@0.7:shadowx=2:shadowy=2,

    drawtext=text='#StopTheInsanity':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=36:x=25:y=h-text_h-25:enable='between(t,52,56)':shadowcolor=black@0.7:shadowx=2:shadowy=2" \
    -c:v libx264 -crf 19 -preset slow \
    -c:a copy \
    "$OUTPUT_VIDEO" -y

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ DEVASTATING TEXT OVERLAYS COMPLETE!"
    echo "📹 Final video: $OUTPUT_VIDEO"
    echo "⏱️ Duration: 56 seconds"
    echo ""
    echo "📝 Text overlays included:"
    echo "   • Commissioner Jessica Berman"
    echo "   • Michele Kang ($30M+ investment)"
    echo "   • Angie Long ($117M stadium)"
    echo "   • The Wilf Family"
    echo "   • 2021 NWSL Policy details"
    echo "   • Young girls' question"
    echo ""
    echo "🏷️ Watermark: @asphaltcowb0y"
    echo "#️⃣ Hashtag: #StopTheInsanity"
    echo ""
    echo "🐦 Ready for X/Twitter!"

    # Show file size and info
    echo ""
    echo "📊 File information:"
    ls -lh "$OUTPUT_VIDEO"
    ffprobe -v quiet -print_format json -show_format "$OUTPUT_VIDEO" | jq '.format | {duration, size, bit_rate}'
else
    echo ""
    echo "❌ Failed to add text overlays"
    echo "Check ffmpeg output above for errors"
fi