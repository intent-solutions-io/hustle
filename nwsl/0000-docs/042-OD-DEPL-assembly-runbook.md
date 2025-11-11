# Assembly Runbook - Phase 5X Execution
**Version:** 1.0
**Date:** 2025-11-07
**Phase:** 5X - Execution Gate + Dry Run
**Purpose:** Step-by-step execution guide for final assembly

---

## ENVIRONMENT SETUP

```bash
#!/bin/bash
set -euo pipefail

# Load environment if exists
if [ -f .env ]; then
    set -a
    . ./.env
    set +a
fi

# Set defaults
: "${FPS:=24}"
: "${AUDIO_RATE_HZ:=48000}"
: "${TARGET_LUFS:=-14}"
```

---

## EXECUTION PATHS

### Path A: Real Assembly (Assets Exist)
Execute when all source files are present and validated.

### Path B: Dry Run (Assets Missing)
Execute with placeholder generation to validate pipeline.

---

## PREFLIGHT CHECKLIST

### 1. Required Source Files
```bash
# Video segments (8 files required)
for i in {01..08}; do
    FILE="030-video/shots/SEG-${i}_best.mp4"
    if [ -f "$FILE" ]; then
        echo "✓ $FILE exists"
    else
        echo "✗ $FILE missing"
        MISSING=true
    fi
done

# Audio master
FILE="020-audio/music/master_mix.wav"
if [ -f "$FILE" ]; then
    echo "✓ $FILE exists"
else
    echo "✗ $FILE missing"
    MISSING=true
fi

# Overlay files
FILE="040-overlays/why_overlays.ass"
if [ -f "$FILE" ]; then
    echo "✓ $FILE exists"
else
    echo "✗ $FILE missing"
    MISSING=true
fi
```

### 2. Media Validation
```bash
# Validate video segments
for i in {01..08}; do
    FILE="030-video/shots/SEG-${i}_best.mp4"
    if [ -f "$FILE" ]; then
        # Check resolution
        RES=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$FILE")
        if [ "$RES" = "1920,1080" ]; then
            echo "✓ SEG-${i}: 1920×1080"
        else
            echo "✗ SEG-${i}: Wrong resolution ($RES)"
        fi

        # Check frame rate
        FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "$FILE")
        if [ "$FPS" = "24/1" ]; then
            echo "✓ SEG-${i}: 24fps"
        else
            echo "✗ SEG-${i}: Wrong fps ($FPS)"
        fi
    fi
done

# Validate audio
FILE="020-audio/music/master_mix.wav"
if [ -f "$FILE" ]; then
    RATE=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$FILE")
    if [ "$RATE" = "$AUDIO_RATE_HZ" ]; then
        echo "✓ Audio: ${AUDIO_RATE_HZ}Hz"
    else
        echo "✗ Audio: Wrong sample rate ($RATE)"
    fi
fi
```

### 3. Overlay Syntax Check
```bash
# Check for unescaped dollar signs
if grep -q '\$[^\\]' "040-overlays/why_overlays.ass" 2>/dev/null; then
    echo "✗ WARNING: Unescaped dollar signs found in overlays"
else
    echo "✓ Dollar signs properly escaped"
fi

# Check ASS syntax
if head -1 "040-overlays/why_overlays.ass" | grep -q "Script Info"; then
    echo "✓ ASS file has valid header"
else
    echo "✗ ASS file may have syntax errors"
fi
```

### 4. Voice-Free Verification
```bash
# Check generation switches
FILE="docs/032-OD-CONF-generation-switches.md"
if [ -f "$FILE" ]; then
    if grep -q "generateAnyAudio: false" "$FILE" && \
       grep -q "vocals: false" "$FILE"; then
        echo "✓ Voice-free switches confirmed"
    else
        echo "✗ WARNING: Voice switches may not be set correctly"
    fi
fi
```

---

## DRY RUN EXECUTION

If any required files are missing, execute dry run:

```bash
#!/bin/bash
echo "🎬 Starting DRY RUN assembly..."

# Create placeholder video segments
for i in {01..08}; do
    N=$(printf "%02d" $i)
    echo "Creating placeholder SEG-${N}..."

    # Calculate duration based on segment
    if [ "$i" -eq 8 ]; then
        DUR="4.01"  # SEG-08 is shorter
    else
        DUR="8.0"   # SEG-01 through SEG-07
    fi

    ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=$DUR" \
        -r $FPS \
        -vf "drawtext=text='SEG-${N} PLACEHOLDER':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
        "030-video/shots/SEG-${N}_best.mp4" -y
done

# Create silent audio (60.04 seconds total)
echo "Creating placeholder audio..."
ffmpeg -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=${AUDIO_RATE_HZ}" \
    -t 60.04 \
    "020-audio/music/master_mix.wav" -y

echo "✅ Placeholder files created"
```

---

## REAL ASSEMBLY EXECUTION

### Step 1: Concatenate Video Segments
```bash
# Create concat list
cat > /tmp/concat.txt << EOF
file '../030-video/shots/SEG-01_best.mp4'
file '../030-video/shots/SEG-02_best.mp4'
file '../030-video/shots/SEG-03_best.mp4'
file '../030-video/shots/SEG-04_best.mp4'
file '../030-video/shots/SEG-05_best.mp4'
file '../030-video/shots/SEG-06_best.mp4'
file '../030-video/shots/SEG-07_best.mp4'
file '../030-video/shots/SEG-08_best.mp4'
EOF

# Concatenate
ffmpeg -f concat -safe 0 -i /tmp/concat.txt \
    -c copy \
    "030-video/assembly/video_only.mp4"
```

### Step 2: Add Audio
```bash
ffmpeg -i "030-video/assembly/video_only.mp4" \
    -i "020-audio/music/master_mix.wav" \
    -c:v copy -c:a aac -b:a 256k \
    -map 0:v -map 1:a \
    "030-video/assembly/video_with_music.mp4"
```

### Step 3: Apply Overlays
```bash
# Execute the overlay pipeline script
bash 050-scripts/ffmpeg_overlay_pipeline.sh \
    "030-video/assembly/video_with_music.mp4" \
    "060-renders/final/master_16x9.mp4"
```

### Step 4: Create Social Versions (Optional)
```bash
# Vertical (9:16) for TikTok/Reels
ffmpeg -i "060-renders/final/master_16x9.mp4" \
    -vf "crop=608:1080:656:0,scale=1080:1920" \
    -c:a copy \
    "060-renders/deliverables/master_9x16.mp4"

# Square (1:1) for Instagram
ffmpeg -i "060-renders/final/master_16x9.mp4" \
    -vf "crop=1080:1080:420:0" \
    -c:a copy \
    "060-renders/deliverables/master_1x1.mp4"
```

---

## QUALITY CONTROL

### Video QC
```bash
FILE="060-renders/final/master_16x9.mp4"

# Check resolution
ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height \
    -of csv=p=0 "$FILE"

# Check frame rate
ffprobe -v error -select_streams v:0 \
    -show_entries stream=r_frame_rate \
    -of default=noprint_wrappers=1:nokey=1 "$FILE"

# Check duration
ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$FILE"
```

### Audio QC
```bash
# Measure loudness
ffmpeg -i "$FILE" -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | \
    grep -E "I:|LRA:|Threshold:|True peak:" | tail -4
```

### Dollar Escaping Verification
```bash
# Capture frame at 20.5s (should show "$30 million+")
ffmpeg -ss 20.5 -i "$FILE" -vframes 1 -q:v 2 /tmp/check_30m.jpg

# Capture frame at 28.5s (should show "$117 million")
ffmpeg -ss 28.5 -i "$FILE" -vframes 1 -q:v 2 /tmp/check_117m.jpg

echo "Check these images for correct dollar amounts:"
echo "  /tmp/check_30m.jpg - Should show '\$30 million+'"
echo "  /tmp/check_117m.jpg - Should show '\$117 million'"
```

---

## TRACEABILITY

### Git Information
```bash
# Record current commit
git log -1 --format="%h %s" >> docs/044-LS-STAT-preflight-results.md

# Record any uncommitted changes
git status --short >> docs/044-LS-STAT-preflight-results.md
```

### Command Log
All commands executed should be logged with timestamps:
```bash
# Function to log commands
log_cmd() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> assembly.log
    "$@"
}

# Use like: log_cmd ffmpeg -i input.mp4 ...
```

---

## TROUBLESHOOTING

### Common Issues

1. **Dollar amounts show as "0 million"**
   - Check escaping in overlay files
   - Ensure backslash before dollar sign: `\$30`

2. **Audio sync issues**
   - Verify all segments are exactly 24fps
   - Check total duration matches audio

3. **Black frames at cuts**
   - Check segment endings
   - May need to trim last frame

4. **Overlay timing off**
   - Verify ASS timecodes
   - Check enable periods in FFmpeg script

---

## COMPLETION CHECKLIST

- [ ] Preflight checks completed
- [ ] Path determined (Real or Dry Run)
- [ ] Assembly executed without errors
- [ ] QC measurements recorded
- [ ] Dollar amounts verified visually
- [ ] Git commit recorded
- [ ] AAR document created

---

**Runbook Generated:** 2025-11-07
**Status:** Ready for execution
**Next:** Run preflight checks to determine path

**END OF RUNBOOK**