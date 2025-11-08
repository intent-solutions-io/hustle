#!/bin/bash
# FINAL ASSEMBLY: Video + Lyria + Text Overlays
# Creates the emotional masterpiece

echo "🎬 ASSEMBLING EMOTIONAL MASTERPIECE"
echo "===================================="

# Merge all video clips
echo "🎥 Merging video clips..."
ffmpeg -i opening.mp4 -i ball.mp4 -i locker.mp4 -i cleats.mp4 \
       -i field.mp4 -i tunnel.mp4 -i lights.mp4 \
       -filter_complex "[0:v][1:v][2:v][3:v][4:v][5:v][6:v]concat=n=7:v=1[v]" \
       -map "[v]" merged_video.mp4 -y

# Add Lyria orchestral score
echo "🎼 Adding Lyria orchestral masterpiece..."
ffmpeg -i merged_video.mp4 -i lyria_score.mp3 \
       -c:v copy -c:a aac -shortest \
       video_with_music.mp4 -y

# Add emotional text overlays
echo "📝 Adding devastating text overlays..."
ffmpeg -i video_with_music.mp4 \
    -filter_complex "[0:v]
    drawtext=text='Commissioner Jessica Berman':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,10,13)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Receives her marching orders from majority owners':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=h-120:enable='between(t,13,15)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Michele Kang - Washington Spirit':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,15,18)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Spent $30 million+ on women\'s soccer':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,18,20)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Why no answer?':fontcolor=red:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,20,22)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='Angie Long - Kansas City Current':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,22,26)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Built a $117 million stadium for women':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,26,28)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='...only to let males play':fontcolor=red:fontsize=48:x=(w-text_w)/2:y=h-80:enable='between(t,28,30)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='The Wilf Family - Orlando Pride':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-150:enable='between(t,30,33)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='What excuse will they use?':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,33,35)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Money, probably.':fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,35,37)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='The 2021 NWSL Policy remains in place':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-120:enable='between(t,37,41)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Males can compete with castration or testosterone blockers':fontcolor=red:fontsize=40:x=(w-text_w)/2:y=h-100:enable='between(t,41,45)':shadowcolor=black@0.8:shadowx=2:shadowy=2,
    drawtext=text='Thousands of young girls are asking...':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,45,49)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Is it all about the money?':fontcolor=yellow:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,49,52)':shadowcolor=black@0.9:shadowx=3:shadowy=3,
    drawtext=text='What happened to women playing women?':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,52,56)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Why won\'t you answer them?':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,56,60)':shadowcolor=black@0.9:shadowx=4:shadowy=4,
    drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=28:x=w-tw-25:y=h-th-25:shadowcolor=black@0.7:shadowx=2:shadowy=2,
    drawtext=text='#StopTheInsanity':fontcolor=white:fontsize=36:x=25:y=h-th-25:enable='between(t,56,60)':shadowcolor=black@0.7:shadowx=2:shadowy=2
    [v]" \
    -map "[v]" -map 0:a -c:v libx264 -crf 19 -c:a copy \
    EMOTIONAL_MASTERPIECE_FINAL.mp4 -y

echo ""
echo "✅ EMOTIONAL MASTERPIECE COMPLETE!"
echo "📹 Final: EMOTIONAL_MASTERPIECE_FINAL.mp4"
echo "⏱️ Duration: 60 seconds"
echo "🎼 Music: Lyria orchestral devastation"
echo "📝 Text: All devastating callouts included"
echo "#️⃣ #StopTheInsanity"
echo "✍️ @asphaltcowb0y"
