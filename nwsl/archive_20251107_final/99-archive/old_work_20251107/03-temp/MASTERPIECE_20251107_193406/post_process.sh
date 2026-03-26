#!/bin/bash
# Post-processing for 60-second masterpiece

echo "📥 Downloading masterpiece from cloud..."
gsutil cp "gs://pipelinepilot-prod-veo-videos/MASTERPIECE_60s/*/sample_0.mp4" ./MASTERPIECE_20251107_193406/masterpiece_raw.mp4

echo "➕ Adding @asphaltcowb0y watermark..."
ffmpeg -i ./MASTERPIECE_20251107_193406/masterpiece_raw.mp4 \
    -vf "drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=32:x=w-tw-30:y=h-th-30:shadowcolor=black@0.7:shadowx=3:shadowy=3" \
    -c:a copy ./MASTERPIECE_20251107_193406/masterpiece_watermarked.mp4 -y

echo "📝 Adding text overlays at key moments..."
ffmpeg -i ./MASTERPIECE_20251107_193406/masterpiece_watermarked.mp4 \
    -filter_complex "[0:v]
    drawtext=text='WHY WON\'T THEY ANSWER?':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,3,7)',
    drawtext=text='60 days of silence':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-100:enable='between(t,10,14)',
    drawtext=text='Players deserve transparency':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:enable='between(t,18,22)',
    drawtext=text='Still waiting...':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,30,34)',
    drawtext=text='DEMAND ANSWERS':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,50,54)',
    drawtext=text='#WhyWontTheyAnswer':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-100:enable='between(t,56,60)'
    [v]" \
    -map "[v]" -map 0:a -c:v libx264 -c:a aac \
    ./MASTERPIECE_20251107_193406/MASTERPIECE_FINAL.mp4 -y

echo "🎯 Optimizing for X/Twitter..."
ffmpeg -i ./MASTERPIECE_20251107_193406/MASTERPIECE_FINAL.mp4 \
    -c:v libx264 -preset slow -crf 23 \
    -c:a aac -b:a 128k \
    -vf "scale=1920:1080" \
    -movflags +faststart \
    ./MASTERPIECE_20251107_193406/WHY_WONT_THEY_ANSWER_60S_X_FINAL.mp4 -y

echo "✅ MASTERPIECE READY!"
echo "Final video: ./MASTERPIECE_20251107_193406/WHY_WONT_THEY_ANSWER_60S_X_FINAL.mp4"
