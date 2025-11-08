#!/bin/bash
# Finalize the 60-second masterpiece with @asphaltcowb0y watermark
# Hashtag: #StopTheInsanity

echo "="
echo "   FINALIZING YOUR 60-SECOND MASTERPIECE"
echo "======================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

OUTPUT_DIR="."
BUCKET="gs://pipelinepilot-prod-veo-videos"

echo -e "${YELLOW}📥 Step 1: Downloading masterpiece from cloud...${NC}"
# Check for 60-second version first
if gsutil ls "${BUCKET}/MASTERPIECE_60s/*/sample_0.mp4" 2>/dev/null; then
    gsutil cp "${BUCKET}/MASTERPIECE_60s/*/sample_0.mp4" masterpiece_raw.mp4
else
    # Fall back to parts if 60s not available
    echo "Downloading parts for merging..."
    gsutil cp "${BUCKET}/MASTERPIECE_part1/*/sample_0.mp4" part1.mp4
    gsutil cp "${BUCKET}/MASTERPIECE_part2/*/sample_0.mp4" part2.mp4

    echo "Merging parts into 60-second video..."
    ffmpeg -i part1.mp4 -i part2.mp4 \
        -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" \
        -map "[v]" -map "[a]" masterpiece_raw.mp4 -y
fi

echo -e "${YELLOW}➕ Step 2: Adding @asphaltcowb0y watermark...${NC}"
ffmpeg -i masterpiece_raw.mp4 \
    -vf "drawtext=text='@asphaltcowb0y':fontcolor=white:fontsize=36:x=w-tw-35:y=h-th-35:shadowcolor=black@0.8:shadowx=3:shadowy=3:font=Arial:bold=1" \
    -c:a copy masterpiece_watermarked.mp4 -y 2>/dev/null

echo -e "${YELLOW}📝 Step 3: Adding emotional text overlays...${NC}"
ffmpeg -i masterpiece_watermarked.mp4 \
    -filter_complex "[0:v]
    drawtext=text='WHY WON'\''T THEY ANSWER?':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,3,7)':shadowcolor=black@0.9:shadowx=4:shadowy=4:font=Arial:bold=1,
    drawtext=text='60 days of silence':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,10,14)':shadowcolor=black@0.8:shadowx=3:shadowy=3:font=Arial,
    drawtext=text='Players deserve transparency':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=100:enable='between(t,18,22)':shadowcolor=black@0.8:shadowx=3:shadowy=3:font=Arial,
    drawtext=text='Still waiting...':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,30,34)':shadowcolor=black@0.8:shadowx=3:shadowy=3:font=Arial:italic=1,
    drawtext=text='DEMAND ANSWERS':fontcolor=red:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,50,54)':shadowcolor=black@0.9:shadowx=4:shadowy=4:font=Arial:bold=1,
    drawtext=text='#StopTheInsanity':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-120:enable='between(t,56,60)':shadowcolor=black@0.8:shadowx=3:shadowy=3:font=Arial:bold=1
    [v]" \
    -map "[v]" -map 0:a -c:v libx264 -crf 20 -preset slower -c:a aac \
    MASTERPIECE_WITH_TEXT.mp4 -y 2>/dev/null

echo -e "${YELLOW}🎯 Step 4: Final optimization for X/Twitter...${NC}"
ffmpeg -i MASTERPIECE_WITH_TEXT.mp4 \
    -c:v libx264 -preset slow -crf 23 \
    -c:a aac -b:a 128k -ar 44100 \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -metadata title="Why Won't They Answer? #StopTheInsanity" \
    -metadata artist="@asphaltcowb0y" \
    WHY_WONT_THEY_ANSWER_60S_FINAL.mp4 -y 2>/dev/null

# Create posting guide
cat > X_POSTING_GUIDE.txt << 'EOF'
====================================================================
X/TWITTER POSTING GUIDE - 60-SECOND MASTERPIECE
====================================================================

RECOMMENDED POST:
-----------------
WHY WON'T THEY ANSWER?

60 days. Zero transparency. Countless athletes left in limbo.

The NWSL's silence isn't neutral—it's a betrayal of the players who deserve answers.

This isn't about politics. It's about fairness, safety, and respect.

Watch. Share. Demand accountability.

#StopTheInsanity #NWSL #WomensSports

@asphaltcowb0y

--------------------------------------------------------------------
ALTERNATIVE THREAD:
--------------------------------------------------------------------
[1/3]
🚨 60 DAYS OF SILENCE

The NWSL continues to refuse any clarity on trans athlete policy.

Watch this. RT if you agree players deserve transparency.

#StopTheInsanity

@asphaltcowb0y

[2/3]
Every day without answers is another day players train without knowing the rules.

The league's cowardice is showing.

#StopTheInsanity #NWSL

[3/3]
This powerful 60-second documentary captures what words cannot.

The empty stadiums. The silence. The betrayal.

It's time to stop the insanity.

====================================================================
VIDEO: WHY_WONT_THEY_ANSWER_60S_FINAL.mp4
Duration: 60 seconds
Watermark: @asphaltcowb0y
Hashtag: #StopTheInsanity
====================================================================
EOF

echo ""
echo -e "${GREEN}======================================================================"
echo -e "✅ MASTERPIECE COMPLETE!"
echo -e "======================================================================${NC}"
echo ""
echo -e "${GREEN}📹 Final Video: WHY_WONT_THEY_ANSWER_60S_FINAL.mp4${NC}"
echo -e "${GREEN}📱 Ready for X/Twitter${NC}"
echo -e "${GREEN}#️⃣ Hashtag: #StopTheInsanity${NC}"
echo -e "${GREEN}✅ Watermark: @asphaltcowb0y${NC}"
echo ""
echo "See X_POSTING_GUIDE.txt for posting instructions"