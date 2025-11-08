#!/bin/bash
# Fix text overlays with correct amounts and timing

echo "🔧 FIXING TEXT OVERLAYS WITH CORRECT AMOUNTS"
echo "============================================"

# Find the merged video
MERGED_VIDEO="SMART_DOC_20251107_201335/SMART_DOC_20251107_201335/merged_documentary.mp4"

if [[ ! -f "$MERGED_VIDEO" ]]; then
    echo "❌ Merged video not found at $MERGED_VIDEO"
    exit 1
fi

echo "✅ Found merged video: $MERGED_VIDEO"
echo "🎬 Applying corrected text overlays..."
echo ""

# Create the output filename
OUTPUT_VIDEO="FIXED_TEXT_60s.mp4"

# Apply CORRECTED text overlays with proper amounts
ffmpeg -i "$MERGED_VIDEO" \
    -vf "
    drawtext=text='WHY WON'\''T THEY ANSWER?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,2,6)':shadowcolor=black@0.9:shadowx=4:shadowy=4,

    drawtext=text='Commissioner Jessica Berman':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,10,13)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Receives her marching orders from majority owners':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=40:x=(w-text_w)/2:y=h-100:enable='between(t,13,15)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Michele Kang - Washington Spirit':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,15,18)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Spent \$30 million+ on women'\''s soccer':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,18,20)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Why no answer?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=red:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,20,22)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='\$30 million... why?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,22,24)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='Angie Long - Kansas City Current':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,24,27)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Built a \$117 million stadium for women':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,27,29)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='...only to let males compete':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=red:fontsize=48:x=(w-text_w)/2:y=h-60:enable='between(t,29,32)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='The Wilf Family - Orlando Pride':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,32,35)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='What excuse will they use?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,35,37)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Money\, probably.':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,37,39)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='The 2021 NWSL Policy remains in place':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,39,43)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Males can compete with castration or testosterone blockers':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=red:fontsize=40:x=(w-text_w)/2:y=h-80:enable='between(t,43,47)':shadowcolor=black@0.8:shadowx=2:shadowy=2,

    drawtext=text='Thousands of young girls are asking...':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,47,50)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='Is it all about the money?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,50,53)':shadowcolor=black@0.9:shadowx=3:shadowy=3,

    drawtext=text='What happened to women playing women?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,53,56)':shadowcolor=black@0.8:shadowx=3:shadowy=3,

    drawtext=text='@asphaltcowb0y':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=28:x=w-text_w-25:y=h-text_h-25:shadowcolor=black@0.7:shadowx=2:shadowy=2,

    drawtext=text='#StopTheInsanity':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=36:x=25:y=h-text_h-25:enable='between(t,52,56)':shadowcolor=black@0.7:shadowx=2:shadowy=2" \
    -c:v libx264 -crf 19 -preset slow \
    -c:a copy \
    "$OUTPUT_VIDEO" -y

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ TEXT OVERLAYS FIXED!"
    echo "📹 Output: $OUTPUT_VIDEO"
    echo ""
    echo "🔧 CORRECTIONS APPLIED:"
    echo "   ✓ Michele Kang: Now shows '$30 million+' (was $0M)"
    echo "   ✓ Added: '$30 million... why?' at 22s"
    echo "   ✓ Changed: '...only to let males compete' (was 'play')"
    echo "   ✓ All amounts now correct"
    echo ""
    echo "📝 Key Messages Fixed:"
    echo "   • Michele Kang - $30 million+ investment"
    echo "   • Angie Long - $117 million stadium"
    echo "   • Males can compete with medical interventions"
    echo ""
    echo "🏷️ Watermark: @asphaltcowb0y"
    echo "#️⃣ Hashtag: #StopTheInsanity"
    echo ""

    # Copy to FINAL_VIDEOS folder
    cp "$OUTPUT_VIDEO" FINAL_VIDEOS/
    echo "📁 Copied to FINAL_VIDEOS folder"

    # Show file info
    ls -lh "$OUTPUT_VIDEO"
else
    echo ""
    echo "❌ Failed to fix text overlays"
fi