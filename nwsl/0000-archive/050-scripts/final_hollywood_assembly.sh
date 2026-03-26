#!/bin/bash
# HOLLYWOOD MASTER ASSEMBLY WITH PROPER BREAKS
# After 3 days - THIS IS IT!
set -euo pipefail

echo "🎬 FINAL HOLLYWOOD ASSEMBLY WITH AUDIO BREAKS"
echo "=============================================="
echo ""

# Check for all segments
echo "📦 Checking segments..."
MISSING=""
for i in 1 2 3 4 5 6 7 8; do
    if [ -f "segments/SEG-0${i}_FINAL.mp4" ]; then
        echo "✅ SEG-0${i}_FINAL.mp4 found"
    else
        echo "❌ SEG-0${i}_FINAL.mp4 missing"
        MISSING="$MISSING $i"
    fi
done

if [ -n "$MISSING" ]; then
    echo ""
    echo "⚠️ Missing segments:$MISSING"
    echo "Attempting to download..."

    # Try downloading missing segments
    for i in $MISSING; do
        VIDEO_PATH=$(gsutil ls "gs://pipelinepilot-prod-veo-videos/seg${i}_explicit/**/*.mp4" 2>/dev/null | head -1)
        if [ -n "$VIDEO_PATH" ]; then
            gsutil cp "$VIDEO_PATH" segments/SEG-0${i}_FINAL.mp4
            echo "✅ Downloaded SEG-0${i}_FINAL.mp4"
        fi
    done
fi

# Create audio with BREAKS (not monotonous!)
echo ""
echo "🎵 Creating dynamic audio with breaks..."

# Generate audio segments with different tones
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=8" -af "volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=7:d=1" audio/tone1.wav 2>/dev/null
ffmpeg -y -f lavfi -i "sine=frequency=523:duration=8" -af "volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=7:d=1" audio/tone2.wav 2>/dev/null
ffmpeg -y -f lavfi -i "sine=frequency=392:duration=8" -af "volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=7:d=1" audio/tone3.wav 2>/dev/null
ffmpeg -y -f lavfi -i "anoisesrc=duration=1" -af "volume=0.1" audio/break.wav 2>/dev/null

# Combine with breaks between sections
ffmpeg -y -i audio/tone1.wav -i audio/break.wav -i audio/tone2.wav -i audio/break.wav -i audio/tone3.wav \
    -filter_complex "[0][1][2][3][4]concat=n=5:v=0:a=1[out]" \
    -map "[out]" audio/dynamic_audio.wav 2>/dev/null

echo "✅ Dynamic audio created"

# Strip audio from all segments
echo ""
echo "🔇 Preparing silent segments..."
for i in 1 2 3 4 5 6 7 8; do
    if [ -f "segments/SEG-0${i}_FINAL.mp4" ]; then
        ffmpeg -y -i segments/SEG-0${i}_FINAL.mp4 -c:v copy -an segments/SEG-0${i}_silent.mp4 2>/dev/null
    fi
done

# Assembly with crossfades (except S5→S6 hard cut)
echo ""
echo "🎬 Assembling with transitions..."

# Build complex filter
FILTER="[0:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v0];"

# Add all video inputs
for i in {1..7}; do
    NEXT=$((i+1))
    FILTER="${FILTER}[${i}:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v${i}];"
done
FILTER="${FILTER}[8:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[v8];"

# Add bridges
BRIDGE_IDX=9
for bridge in 12 23 34 45 56 67 78; do
    if [ -f "segments/BR-${bridge}.mp4" ]; then
        FILTER="${FILTER}[${BRIDGE_IDX}:v]settb=AVTB,fps=24,scale=1920:1080,setsar=1[br${bridge}];"
        ((BRIDGE_IDX++))
    fi
done

# Create transitions with bridges
FILTER="${FILTER}[v0][br12]concat=n=2:v=1:a=0[t01];"
FILTER="${FILTER}[t01][v1]xfade=transition=fade:duration=0.8:offset=8.2[t12];"
FILTER="${FILTER}[t12][br23]concat=n=2:v=1:a=0[t12b];"
FILTER="${FILTER}[t12b][v2]xfade=transition=fade:duration=0.8:offset=17.2[t23];"
FILTER="${FILTER}[t23][br34]concat=n=2:v=1:a=0[t23b];"
FILTER="${FILTER}[t23b][v3]xfade=transition=fade:duration=0.8:offset=26.2[t34];"
FILTER="${FILTER}[t34][br45]concat=n=2:v=1:a=0[t34b];"
FILTER="${FILTER}[t34b][v4]xfade=transition=fade:duration=0.8:offset=35.2[t45];"

# Hard cut between S5 and S6
FILTER="${FILTER}[t45][br56]concat=n=2:v=1:a=0[t45b];"
FILTER="${FILTER}[t45b][v5]concat=n=2:v=1:a=0[t56];" # No fade - hard cut

FILTER="${FILTER}[t56][br67]concat=n=2:v=1:a=0[t56b];"
FILTER="${FILTER}[t56b][v6]xfade=transition=fade:duration=0.8:offset=52.2[t67];"
FILTER="${FILTER}[t67][br78]concat=n=2:v=1:a=0[t67b];"
FILTER="${FILTER}[t67b][v7]xfade=transition=fade:duration=0.8:offset=61.2[t78];"
FILTER="${FILTER}[t78][v8]xfade=transition=fade:duration=0.8:offset=70.2[vfinal];"

# Add text overlays
OVERLAY_FILE="docs/036-DD-DATA-overlay-map.csv"
if [ -f "$OVERLAY_FILE" ]; then
    echo "📝 Adding text overlays..."

    # Parse CSV and add overlays
    OVERLAY_FILTER="[vfinal]"

    while IFS=, read -r start end text anchor x y style; do
        # Skip header
        if [[ "$start" == "time_in_sec" ]]; then continue; fi

        # Clean up text
        text=$(echo "$text" | tr -d '"' | sed "s/'/\\\\'/g")

        # Determine font size and color based on style
        case "$style" in
            "primary")
                FONTSIZE=48
                FONTCOLOR="yellow"
                ;;
            "secondary")
                FONTSIZE=36
                FONTCOLOR="white"
                ;;
            "watermark")
                FONTSIZE=24
                FONTCOLOR="white@0.7"
                ;;
            *)
                FONTSIZE=36
                FONTCOLOR="white"
                ;;
        esac

        # Build drawtext filter
        OVERLAY_FILTER="${OVERLAY_FILTER}drawtext=text='${text}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${FONTSIZE}:fontcolor=${FONTCOLOR}:x=(w-text_w)/2+${x}:y=h/2+${y}:enable='between(t,${start},${end})',"
    done < "$OVERLAY_FILE"

    # Remove trailing comma and add output
    OVERLAY_FILTER="${OVERLAY_FILTER%,}[vwithtext]"
    FILTER="${FILTER}${OVERLAY_FILTER}"
else
    FILTER="${FILTER}[vfinal]copy[vwithtext]"
fi

# Add black tail
FILTER="${FILTER};[vwithtext]tpad=stop_mode=clone:stop_duration=2[vout]"

echo ""
echo "🚀 Running final assembly..."

# Build input list
INPUTS=""
for i in {1..8}; do
    INPUTS="$INPUTS -i segments/SEG-0${i}_silent.mp4"
done

# Add bridges
for bridge in 12 23 34 45 56 67 78; do
    if [ -f "segments/BR-${bridge}.mp4" ]; then
        INPUTS="$INPUTS -i segments/BR-${bridge}.mp4"
    fi
done

# Run assembly
ffmpeg -y \
    $INPUTS \
    -i audio/dynamic_audio.wav \
    -filter_complex "$FILTER" \
    -map "[vout]" \
    -map "${BRIDGE_IDX}:a" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    060-renders/HOLLYWOOD_FINAL_MASTER.mp4

if [ -f "060-renders/HOLLYWOOD_FINAL_MASTER.mp4" ]; then
    echo ""
    echo "✅ HOLLYWOOD MASTER CREATED!"
    echo "📹 Output: 060-renders/HOLLYWOOD_FINAL_MASTER.mp4"

    # Get file info
    SIZE=$(ls -lh 060-renders/HOLLYWOOD_FINAL_MASTER.mp4 | awk '{print $5}')
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 060-renders/HOLLYWOOD_FINAL_MASTER.mp4 2>/dev/null | cut -d. -f1)

    echo "📊 Size: $SIZE"
    echo "⏱️ Duration: ${DURATION} seconds"
    echo ""
    echo "🎉 AFTER 3 DAYS - WE DID IT!"
    echo "🏆 Award-winning video ready to move mountains!"
else
    echo "❌ Assembly failed"
    exit 1
fi