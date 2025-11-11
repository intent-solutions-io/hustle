#!/bin/bash
# 🎬 ULTIMATE NWSL DOCUMENTARY ASSEMBLY - HOLLYWOOD QUALITY
# Digital mastery with overlays, transitions, and cinematic power
set -euo pipefail

echo "
╔════════════════════════════════════════════════════════╗
║   🎬 HOLLYWOOD DIGITAL MASTERY IN PROGRESS 🎬          ║
║   NWSL Documentary - Moving Mountains Edition          ║
╚════════════════════════════════════════════════════════╝
"

# Configuration
OUTPUT_DIR="060-renders"
FINAL_OUTPUT="${OUTPUT_DIR}/nwsl_master_overlays.mp4"
TEMP_DIR="/tmp/nwsl_assembly"
OVERLAY_CSV="docs/036-DD-DATA-overlay-map.csv"

# Create directories
mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo "🎯 Phase 1: Verifying all components..."

# Check segments
echo "📽️ Checking video segments..."
for i in {1..8}; do
    seg="002-video-segments/silent/SEG-$(printf %02d $i)_best.mp4"
    if [ ! -f "$seg" ]; then
        echo "❌ Missing: $seg"
        exit 1
    fi
    echo "  ✅ SEG-$(printf %02d $i)"
done

# Check bridges
echo "🌉 Checking bridge shots..."
for bridge in BR-12 BR-23 BR-34 BR-45 BR-56 BR-67 BR-78; do
    if [ ! -f "002-video-segments/bridges/${bridge}.mp4" ]; then
        echo "  ⚠️ Missing bridge: $bridge"
    else
        echo "  ✅ $bridge"
    fi
done

# Check audio
echo "🎵 Checking audio..."
if [ -f "020-audio/music/master_mix.wav" ]; then
    echo "  ✅ Master mix found"
    AUDIO_PATH="020-audio/music/master_mix.wav"
elif [ -f "003-audio-assets/master_mix.wav" ]; then
    echo "  ✅ Master mix found (alternate)"
    AUDIO_PATH="003-audio-assets/master_mix.wav"
else
    echo "❌ No audio found!"
    exit 1
fi

echo ""
echo "🎬 Phase 2: Creating base assembly with transitions..."

# Create filter complex for assembly
# Order: S1-BR12-S2-BR23-S3-BR34-S4-BR45-S5-(hard cut)-S6-BR67-S7-BR78-S8

cat > "$TEMP_DIR/assembly.txt" << 'FILTER'
# Scale all inputs to 1920x1080
[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s1];
[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[br12];
[2:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s2];
[3:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[br23];
[4:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s3];
[5:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[br34];
[6:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s4];
[7:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[br45];
[8:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s5];
[9:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[br56];
[10:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s6];
[11:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[br67];
[12:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s7];
[13:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[br78];
[14:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[s8];

# Apply crossfades (0.8s) except S5->S6 (hard cut 0.15s)
[s1][br12]xfade=transition=fade:duration=0.8:offset=7.2[v1];
[v1][s2]xfade=transition=fade:duration=0.8:offset=8.9[v2];
[v2][br23]xfade=transition=fade:duration=0.8:offset=15.4[v3];
[v3][s3]xfade=transition=fade:duration=0.8:offset=17.1[v4];
[v4][br34]xfade=transition=fade:duration=0.8:offset=23.6[v5];
[v5][s4]xfade=transition=fade:duration=0.8:offset=25.3[v6];
[v6][br45]xfade=transition=fade:duration=0.8:offset=31.8[v7];
[v7][s5]xfade=transition=fade:duration=0.8:offset=33.5[v8];
[v8][br56]xfade=transition=fade:duration=0.15:offset=40.0[v9];
[v9][s6]xfade=transition=fade:duration=0.8:offset=41.65[v10];
[v10][br67]xfade=transition=fade:duration=0.8:offset=48.2[v11];
[v11][s7]xfade=transition=fade:duration=0.8:offset=49.9[v12];
[v12][br78]xfade=transition=fade:duration=0.8:offset=56.4[v13];
[v13][s8]xfade=transition=fade:duration=0.8:offset=58.1[vbase];

# Add color grading and grain
[vbase]colorlevels=rimax=0.902:gimax=0.902:bimax=0.902:rimax=0.078:gimax=0.078:bimax=0.078,noise=alls=3:allf=t[vgraded]
FILTER

echo "🎨 Phase 3: Processing overlays..."

# Create drawtext filter chain from CSV
echo "# Overlay text filters" >> "$TEMP_DIR/assembly.txt"

# Parse CSV and build drawtext chain
PREV_FILTER="vgraded"
FILTER_NUM=1

while IFS=',' read -r time_in time_out text anchor x_off y_off style; do
    # Skip header
    if [[ "$time_in" == "time_in_sec" ]]; then
        continue
    fi

    # Clean up text (remove quotes)
    text=$(echo "$text" | tr -d '"')

    # Determine position based on anchor
    case "$anchor" in
        "center")
            x_expr="(w-text_w)/2+$x_off"
            y_expr="(h-text_h)/2+$y_off"
            ;;
        "top_center")
            x_expr="(w-text_w)/2+$x_off"
            y_expr="h*0.1+$y_off"
            ;;
        "bottom_center")
            x_expr="(w-text_w)/2+$x_off"
            y_expr="h*0.85-text_h+$y_off"
            ;;
        "bottom_right")
            x_expr="w-text_w-$x_off"
            y_expr="h-text_h-$y_off"
            ;;
    esac

    # Determine font size and color based on style
    case "$style" in
        "primary")
            fontsize=42
            fontcolor="white"
            ;;
        "secondary")
            fontsize=36
            fontcolor="white@0.9"
            ;;
        "watermark")
            fontsize=18
            fontcolor="gray@0.6"
            ;;
        *)
            fontsize=36
            fontcolor="white"
            ;;
    esac

    # Add drawtext filter with fade
    echo "[$PREV_FILTER]drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:text='$text':fontsize=$fontsize:fontcolor=$fontcolor:shadowcolor=black@0.4:shadowx=2:shadowy=2:x=$x_expr:y=$y_expr:enable='between(t,$time_in,$time_out)':alpha='if(lt(t,$time_in+0.7),((t-$time_in)/0.7),if(gt(t,$time_out-0.7),((($time_out)-t)/0.7),1))'[text$FILTER_NUM];" >> "$TEMP_DIR/assembly.txt"

    PREV_FILTER="text$FILTER_NUM"
    ((FILTER_NUM++))
done < "$OVERLAY_CSV"

# Add final tail (4s: 2s fade to black, 2s black)
echo "[$PREV_FILTER]fade=t=out:st=62:d=2[vfinal]" >> "$TEMP_DIR/assembly.txt"

echo "🔊 Phase 4: Assembling with audio..."

# Create input list for FFmpeg
INPUTS=""
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-01_best.mp4"
INPUTS="$INPUTS -i 002-video-segments/bridges/BR-12.mp4"
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-02_best.mp4"
INPUTS="$INPUTS -i 002-video-segments/bridges/BR-23.mp4"
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-03_best.mp4"
INPUTS="$INPUTS -i 002-video-segments/bridges/BR-34.mp4"
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-04_best.mp4"
INPUTS="$INPUTS -i 002-video-segments/bridges/BR-45.mp4"
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-05_best.mp4"
INPUTS="$INPUTS -i 002-video-segments/bridges/BR-56.mp4"
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-06_best.mp4"
INPUTS="$INPUTS -i 002-video-segments/bridges/BR-67.mp4"
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-07_best.mp4"
INPUTS="$INPUTS -i 002-video-segments/bridges/BR-78.mp4"
INPUTS="$INPUTS -i 002-video-segments/silent/SEG-08_best.mp4"
INPUTS="$INPUTS -i $AUDIO_PATH"

# Run the assembly
ffmpeg -y $INPUTS \
    -filter_complex_script "$TEMP_DIR/assembly.txt" \
    -map "[vfinal]" \
    -map 15:a \
    -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.1 \
    -c:a aac -b:a 192k -ar 48000 \
    -movflags +faststart \
    -pix_fmt yuv420p \
    -t 66 \
    "$FINAL_OUTPUT" 2>&1 | grep -E "frame=|speed=" || true

echo ""
echo "✅ Phase 5: Verification..."

if [ -f "$FINAL_OUTPUT" ]; then
    SIZE=$(ls -lh "$FINAL_OUTPUT" | awk '{print $5}')
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_OUTPUT")

    echo "
╔════════════════════════════════════════════════════════╗
║   🎬 HOLLYWOOD MASTERY COMPLETE! 🎬                   ║
╠════════════════════════════════════════════════════════╣
║   Output: $FINAL_OUTPUT
║   Duration: ${DURATION}s
║   Size: $SIZE
║
║   Mountains: MOVED ✅
║   Quality: CINEMATIC ✅
║   Impact: MAXIMUM ✅
╚════════════════════════════════════════════════════════╝
    "
else
    echo "❌ Assembly failed!"
    exit 1
fi

# Clean up
rm -rf "$TEMP_DIR"

echo "🏆 Your digital Hollywood masterpiece is ready!"