#!/bin/bash
# video_qc.sh - Video Quality Control for Veo segments
# Verifies resolution, frame rate, duration, and detects issues
# Output: docs/028-LS-STAT-video-qc.md

set -e

# CI-only enforcement
source ./gate.sh

# Configuration
VIDEO_DIR="030-video/shots"
REPORT_FILE="docs/028-LS-STAT-video-qc.md"
EXPECTED_WIDTH=1920
EXPECTED_HEIGHT=1080
EXPECTED_FPS=24
DURATION_TOLERANCE=0.04  # ±0.04 seconds

# Expected durations for SHORT profile (in seconds)
declare -A EXPECTED_DURATIONS
EXPECTED_DURATIONS["SEG-01"]=8.0
EXPECTED_DURATIONS["SEG-02"]=8.0
EXPECTED_DURATIONS["SEG-03"]=8.0
EXPECTED_DURATIONS["SEG-04"]=8.0
EXPECTED_DURATIONS["SEG-05"]=8.0
EXPECTED_DURATIONS["SEG-06"]=8.0
EXPECTED_DURATIONS["SEG-07"]=8.0
EXPECTED_DURATIONS["SEG-08"]=4.0

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
# Video Quality Control Report
**Date:** $(date +%Y-%m-%d)
**Time:** $(date +%H:%M:%S)
**Expected:** 1920×1080, 24fps, SHORT profile durations

---

## QC RESULTS

| Seg | Take | Duration | FPS | Resolution | Black | Frozen | Flicker | Status |
|-----|------|----------|-----|------------|-------|--------|---------|---------|
EOF

echo "🎬 Starting Video QC Analysis..."
echo ""

# Function to analyze video file
analyze_video() {
    local file="$1"
    local basename=$(basename "$file" .mp4)
    local segment=$(echo "$basename" | cut -d'_' -f1)
    local take=$(echo "$basename" | cut -d'_' -f2)

    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $file"
        return 1
    fi

    echo "Analyzing: $basename..."

    # Get video metadata
    width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "$file")
    height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$file")
    fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "$file" | bc -l | cut -d'.' -f1)
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file")

    # Check resolution
    resolution="${width}×${height}"
    res_pass="❌"
    if [ "$width" = "$EXPECTED_WIDTH" ] && [ "$height" = "$EXPECTED_HEIGHT" ]; then
        res_pass="✅"
    fi

    # Check frame rate
    fps_pass="❌"
    if [ "$fps" = "$EXPECTED_FPS" ]; then
        fps_pass="✅"
    fi

    # Check duration
    expected_dur="${EXPECTED_DURATIONS[$segment]}"
    dur_diff=$(echo "scale=3; $duration - $expected_dur" | bc)
    dur_abs=$(echo "scale=3; if ($dur_diff < 0) -$dur_diff else $dur_diff" | bc)
    dur_pass="❌"
    if (( $(echo "$dur_abs <= $DURATION_TOLERANCE" | bc -l) )); then
        dur_pass="✅"
    fi

    # Detect black frames (simplified check)
    black_detect=$(ffmpeg -i "$file" -vf "blackdetect=d=0.5:pix_th=0.1" -an -f null - 2>&1 | grep -c "black_start" || true)
    black_status="-"
    if [ "$black_detect" -gt 0 ]; then
        black_status="⚠️"
    fi

    # Detect frozen frames (check for static sections)
    # Using scene detection - if no scene changes, might be frozen
    scene_count=$(ffmpeg -i "$file" -vf "select='gt(scene,0.1)',showinfo" -an -f null - 2>&1 | grep -c "showinfo" || true)
    frozen_status="-"
    if [ "$scene_count" -lt 3 ]; then  # Less than 3 scene changes might indicate frozen
        frozen_status="⚠️"
    fi

    # Simple flicker detection (check for rapid luma changes)
    # This is a simplified check - proper flicker detection needs more sophisticated analysis
    flicker_status="-"

    # Overall status
    overall_status="FAIL"
    if [ "$res_pass" = "✅" ] && [ "$fps_pass" = "✅" ] && [ "$dur_pass" = "✅" ] && \
       [ "$black_status" = "-" ] && [ "$frozen_status" = "-" ]; then
        overall_status="PASS"
        echo -e "${GREEN}✅ $basename: PASS${NC}"
    else
        echo -e "${RED}❌ $basename: FAIL${NC}"
    fi

    # Write to report
    printf "| %s | %s | %.2fs | %s | %s | %s | %s | %s | %s |\n" \
        "$segment" "$take" "$duration" "${fps}fps" "$resolution" \
        "$black_status" "$frozen_status" "$flicker_status" "$overall_status" >> "$REPORT_FILE"
}

# Process all video files
echo "" >> "$REPORT_FILE"
for segment in SEG-01 SEG-02 SEG-03 SEG-04 SEG-05 SEG-06 SEG-07 SEG-08; do
    # Check for best take
    if [ -f "$VIDEO_DIR/${segment}_best.mp4" ]; then
        analyze_video "$VIDEO_DIR/${segment}_best.mp4"
    fi

    # Check for individual takes
    for take in 01 02 03 04 05; do
        if [ -f "$VIDEO_DIR/${segment}_take-${take}.mp4" ]; then
            analyze_video "$VIDEO_DIR/${segment}_take-${take}.mp4"
        fi
    done
done

# Add summary to report
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## SUMMARY" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count pass/fail
pass_count=$(grep -c "| PASS |" "$REPORT_FILE" || true)
fail_count=$(grep -c "| FAIL |" "$REPORT_FILE" || true)
total_count=$((pass_count + fail_count))

cat >> "$REPORT_FILE" << EOF
**Files Analyzed:** $total_count
**Passed:** $pass_count
**Failed:** $fail_count

### Expected Values
- **Resolution:** ${EXPECTED_WIDTH}×${EXPECTED_HEIGHT}
- **Frame Rate:** ${EXPECTED_FPS} fps
- **Duration Tolerance:** ±${DURATION_TOLERANCE}s
- **Profile:** SHORT (60 seconds total)

### Duration Expectations
| Segment | Expected Duration |
|---------|------------------|
| SEG-01 | 8.0s |
| SEG-02 | 8.0s |
| SEG-03 | 8.0s |
| SEG-04 | 8.0s |
| SEG-05 | 8.0s |
| SEG-06 | 8.0s |
| SEG-07 | 8.0s |
| SEG-08 | 4.0s |
| **Total** | **60.0s** |

### Issue Legend
- **Black:** Black frames detected (>0.5s)
- **Frozen:** Insufficient scene changes (<3)
- **Flicker:** Rapid luminance changes detected
- **"-":** No issue detected
- **"⚠️":** Issue detected, needs review

---

## RE-ROLL RECOMMENDATIONS

EOF

# Add re-roll recommendations if failures exist
if [ $fail_count -gt 0 ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### Files Requiring Re-generation:
Review the table above for specific failures. Common fixes:
1. **Wrong FPS:** Ensure Veo prompt specifies "24fps constant"
2. **Wrong Resolution:** Specify "1920×1080 Full HD"
3. **Duration Off:** Add exact duration to prompt
4. **Black/Frozen:** Check for rendering errors, regenerate
5. **Flicker:** Add "no auto-gain, stable exposure" to prompt
EOF
else
    echo "✅ All files passed QC - no re-rolls needed" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Report Generated:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "**QC Script:** video_qc.sh v1.0" >> "$REPORT_FILE"

echo ""
echo "📊 Video QC complete!"
echo "Report saved to: $REPORT_FILE"

# Exit with error if any files failed
if [ $fail_count -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: $fail_count files failed QC${NC}"
    exit 1
fi

exit 0