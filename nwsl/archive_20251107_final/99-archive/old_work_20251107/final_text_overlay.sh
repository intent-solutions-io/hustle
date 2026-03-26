#!/bin/bash

echo "========================================================================"
echo "📝 ADDING TEXT OVERLAYS WITH CORRECT $30 MILLION TEXT"
echo "========================================================================"
echo ""
echo "✅ Michele Kang will show: '\$30 million+ on women's soccer'"
echo ""

# Check if base video exists
if [ ! -f "COMPLETE_60s_NO_TEXT_TRULY_FIXED.mp4" ]; then
    echo "❌ Error: Base video not found!"
    exit 1
fi

echo "🎬 Adding text overlays..."
echo ""

# Use FFmpeg with properly escaped text
# The key is using printf to handle the dollar signs correctly
ffmpeg -i COMPLETE_60s_NO_TEXT_TRULY_FIXED.mp4 \
    -vf "drawtext=text='WHY WON'\''T THEY ANSWER?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,2,6)':shadowcolor=black@0.9:shadowx=4:shadowy=4,\
drawtext=text='Commissioner Jessica Berman':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,10,13)':shadowcolor=black@0.8:shadowx=3:shadowy=3,\
drawtext=text='Receives her marching orders from majority owners':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=40:x=(w-text_w)/2:y=h-100:enable='between(t,13,15)':shadowcolor=black@0.8:shadowx=2:shadowy=2,\
drawtext=text='Michele Kang - Washington Spirit':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,16,19)':shadowcolor=black@0.8:shadowx=3:shadowy=3,\
drawtext=text='Spent \$30 million+ on women'\''s soccer':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,19,21)':shadowcolor=black@0.8:shadowx=2:shadowy=2,\
drawtext=text='Why no answer?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,22,24)':shadowcolor=black@0.9:shadowx=3:shadowy=3,\
drawtext=text='Angie Long - Kansas City Current':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,24,27)':shadowcolor=black@0.8:shadowx=3:shadowy=3,\
drawtext=text='Built a \$117 million stadium for women':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,27,29)':shadowcolor=black@0.8:shadowx=2:shadowy=2,\
drawtext=text='...only to let males play':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=red:fontsize=48:x=(w-text_w)/2:y=h-60:enable='between(t,30,32)':shadowcolor=black@0.9:shadowx=3:shadowy=3,\
drawtext=text='The Wilf Family - Orlando Pride':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,32,35)':shadowcolor=black@0.8:shadowx=3:shadowy=3,\
drawtext=text='What excuse will they use?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-100:enable='between(t,35,37)':shadowcolor=black@0.8:shadowx=2:shadowy=2,\
drawtext=text='Money\, probably.':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,37,40)':shadowcolor=black@0.9:shadowx=3:shadowy=3,\
drawtext=text='The 2021 NWSL Policy remains in place':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,40,44)':shadowcolor=black@0.8:shadowx=2:shadowy=2,\
drawtext=text='Males can compete with castration or testosterone blockers':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=red:fontsize=40:x=(w-text_w)/2:y=h-80:enable='between(t,44,48)':shadowcolor=black@0.8:shadowx=2:shadowy=2,\
drawtext=text='Thousands of young girls are asking...':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,48,51)':shadowcolor=black@0.8:shadowx=3:shadowy=3,\
drawtext=text='Is it all about the money?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,51,54)':shadowcolor=black@0.9:shadowx=3:shadowy=3,\
drawtext=text='What happened to women playing women?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,54,57)':shadowcolor=black@0.8:shadowx=3:shadowy=3,\
drawtext=text='Why won'\''t you answer them?':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,57,60)':shadowcolor=black@0.9:shadowx=4:shadowy=4,\
drawtext=text='@asphaltcowb0y':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=28:x=w-text_w-25:y=h-text_h-25:shadowcolor=black@0.7:shadowx=2:shadowy=2,\
drawtext=text='#StopTheInsanity':fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:fontcolor=white:fontsize=36:x=25:y=h-text_h-25:enable='between(t,54,60)':shadowcolor=black@0.7:shadowx=2:shadowy=2,\
fade=t=out:st=59:d=1" \
    -c:v libx264 -crf 18 -preset slow \
    -c:a aac -b:a 192k -ar 48000 \
    FINAL_60s_COMPLETE_WITH_CORRECT_TEXT.mp4 -y

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ VIDEO COMPLETE WITH CORRECT TEXT!"
    echo ""

    # Create final delivery folder
    mkdir -p FINAL_DELIVERY_COMPLETE
    cp FINAL_60s_COMPLETE_WITH_CORRECT_TEXT.mp4 FINAL_DELIVERY_COMPLETE/
    cp FINAL_60s_COMPLETE_WITH_CORRECT_TEXT.mp4 FINAL_DELIVERY_COMPLETE/WHY_WONT_THEY_ANSWER_60s_FINAL.mp4

    echo "========================================================================"
    echo "✅ VIDEO READY FOR DISTRIBUTION!"
    echo "========================================================================"
    echo ""
    echo "📍 Location: FINAL_DELIVERY_COMPLETE/"
    echo "📹 Filename: WHY_WONT_THEY_ANSWER_60s_FINAL.mp4"
    echo ""
    echo "✅ TEXT OVERLAYS:"
    echo "   • Michele Kang: '\$30 million+ on women's soccer' ✅"
    echo "   • Angie Long: '\$117 million stadium' ✅"
    echo "   • Policy: 'Males can compete with castration or testosterone blockers' ✅"
    echo "   • Final: 'Why won't you answer them?' ✅"
    echo "   • Hashtag: #StopTheInsanity ✅"
    echo "   • Watermark: @asphaltcowb0y ✅"
    echo ""
    echo "🎯 Ready for upload to X/Twitter!"
    echo "========================================================================"

    # Show file info
    ls -lh FINAL_DELIVERY_COMPLETE/*.mp4
else
    echo "❌ Error adding text overlays"
fi