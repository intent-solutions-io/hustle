#!/bin/bash
# Smart Documentary Merger with Transitions
# Adds crossfade transitions between clips for smooth flow

echo "🎬 SMART DOCUMENTARY MERGER"
echo "=========================="

OUTPUT_DIR="./SMART_DOC_20251107_201335"
BUCKET="gs://pipelinepilot-prod-veo-videos"

# Download all clips
echo "📥 Downloading clips..."
for clip in opening ball locker cleats field tunnel lights; do
    echo "Downloading ${clip}..."
    gsutil cp "${BUCKET}/smart_doc/${clip}/*/sample_0.mp4" "${OUTPUT_DIR}/${clip}.mp4" 2>/dev/null || echo "Waiting for ${clip}..."
done

# Create clips with fade transitions
echo "🎨 Adding transitions..."

# Process each clip with fade in/out
for i in 1 2 3 4 5 6 7; do
    case $i in
        1) clip="opening" ;;
        2) clip="ball" ;;
        3) clip="locker" ;;
        4) clip="cleats" ;;
        5) clip="field" ;;
        6) clip="tunnel" ;;
        7) clip="lights" ;;
    esac

    if [ -f "${OUTPUT_DIR}/${clip}.mp4" ]; then
        # Add 0.5s crossfade transitions
        ffmpeg -i "${OUTPUT_DIR}/${clip}.mp4" \
            -vf "fade=t=in:st=0:d=0.5,fade=t=out:st=3.5:d=0.5" \
            -c:a copy "${OUTPUT_DIR}/${clip}_fade.mp4" -y 2>/dev/null
    fi
done

# Merge with crossfade transitions using filter_complex
echo "🔗 Merging clips with smooth transitions..."

ffmpeg -i "${OUTPUT_DIR}/opening_fade.mp4" \
       -i "${OUTPUT_DIR}/ball_fade.mp4" \
       -i "${OUTPUT_DIR}/locker_fade.mp4" \
       -i "${OUTPUT_DIR}/cleats_fade.mp4" \
       -i "${OUTPUT_DIR}/field_fade.mp4" \
       -i "${OUTPUT_DIR}/tunnel_fade.mp4" \
       -i "${OUTPUT_DIR}/lights_fade.mp4" \
       -filter_complex "
       [0:v][0:a][1:v][1:a][2:v][2:a][3:v][3:a][4:v][4:a][5:v][5:a][6:v][6:a]
       concat=n=7:v=1:a=1[v][a]" \
       -map "[v]" -map "[a]" \
       "${OUTPUT_DIR}/merged_documentary.mp4" -y

# Add emotional text overlays
echo "📝 Adding text overlays..."

ffmpeg -i "${OUTPUT_DIR}/merged_documentary.mp4" \
    -filter_complex "[0:v]
    drawtext=text='WHY WON\'T THEY ANSWER?':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,2,5)':shadowcolor=black@0.9:shadowx=4:shadowy=4,
    drawtext=text='60 days of silence':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-100:enable='between(t,8,11)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='Players deserve answers':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:enable='between(t,15,18)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='#StopTheInsanity':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,25,30)':shadowcolor=black@0.8:shadowx=3:shadowy=3,
    drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=28:x=w-tw-25:y=h-th-25:shadowcolor=black@0.7:shadowx=2:shadowy=2
    [v]" \
    -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a aac \
    "${OUTPUT_DIR}/documentary_with_text.mp4" -y

# Final X/Twitter optimization
echo "🐦 Optimizing for X/Twitter..."

ffmpeg -i "${OUTPUT_DIR}/documentary_with_text.mp4" \
    -c:v libx264 -preset slow -crf 23 \
    -c:a aac -b:a 128k \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080" \
    -movflags +faststart \
    "${OUTPUT_DIR}/SMART_DOCUMENTARY_FINAL.mp4" -y

echo ""
echo "✅ SMART DOCUMENTARY COMPLETE!"
echo "📹 Final: ${OUTPUT_DIR}/SMART_DOCUMENTARY_FINAL.mp4"
echo "⏱️ Duration: ~32 seconds"
echo "#️⃣ Hashtag: #StopTheInsanity"
echo "✍️ Credit: @asphaltcowb0y"
