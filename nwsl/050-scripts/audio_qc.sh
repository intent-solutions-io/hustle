#!/bin/bash
# audio_qc.sh - Audio Quality Control using FFmpeg EBU R128 loudness analysis
# Generates loudness report for Lyria master and stems
# Output: docs/024-LS-STAT-audio-loudness-report.md

set -e

# CI-only enforcement
source ./gate.sh

# Configuration
AUDIO_DIR="020-audio/music"
REPORT_FILE="docs/024-LS-STAT-audio-loudness-report.md"
TARGET_LUFS=-14
TARGET_TP=-1.0
TEMP_DIR="/tmp/audio_qc_$$"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create temp directory
mkdir -p "$TEMP_DIR"

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
# Audio Loudness Report
**Date:** $(date +%Y-%m-%d)
**Time:** $(date +%H:%M:%S)
**Target:** -14 LUFS (±1 LU tolerance)
**True Peak:** ≤ -1.0 dBTP

---

## Master Mix Analysis

EOF

echo "🎵 Starting Audio QC Analysis..."
echo "Target: ${TARGET_LUFS} LUFS, True Peak: ${TARGET_TP} dBTP"
echo ""

# Function to analyze audio file
analyze_audio() {
    local file="$1"
    local name="$2"

    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $file"
        echo "### $name" >> "$REPORT_FILE"
        echo "**Status:** FILE NOT FOUND" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        return 1
    fi

    echo "Analyzing: $name..."

    # Run FFmpeg loudness analysis
    ffmpeg -i "$file" -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | \
        grep -A 20 "Summary:" > "$TEMP_DIR/analysis.txt"

    # Extract values
    integrated=$(grep "I:" "$TEMP_DIR/analysis.txt" | head -1 | awk '{print $2}')
    range=$(grep "LRA:" "$TEMP_DIR/analysis.txt" | awk '{print $2}')
    true_peak=$(grep "Peak:" "$TEMP_DIR/analysis.txt" | head -1 | awk '{print $2}')

    # Get file info
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" | cut -d. -f1)
    sample_rate=$(ffprobe -v error -select_streams a -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$file")
    channels=$(ffprobe -v error -select_streams a -show_entries stream=channels -of default=noprint_wrappers=1:nokey=1 "$file")
    codec=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$file")

    # Check compliance
    lufs_pass="❌"
    tp_pass="❌"
    overall_pass="FAIL"

    if (( $(echo "$integrated >= $(echo "$TARGET_LUFS - 1" | bc)" | bc -l) )) && \
       (( $(echo "$integrated <= $(echo "$TARGET_LUFS + 1" | bc)" | bc -l) )); then
        lufs_pass="✅"
    fi

    if (( $(echo "$true_peak <= $TARGET_TP" | bc -l) )); then
        tp_pass="✅"
    fi

    if [ "$lufs_pass" = "✅" ] && [ "$tp_pass" = "✅" ]; then
        overall_pass="PASS"
        echo -e "${GREEN}✅ $name: PASS${NC}"
    else
        echo -e "${RED}❌ $name: FAIL${NC}"
    fi

    # Write to report
    cat >> "$REPORT_FILE" << EOF
### $name

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Integrated Loudness | $integrated LUFS | $TARGET_LUFS ±1 LUFS | $lufs_pass |
| Loudness Range | $range LU | 7-12 LU | - |
| True Peak | $true_peak dBTP | ≤ $TARGET_TP dBTP | $tp_pass |
| Duration | ${duration}s | - | - |
| Sample Rate | $sample_rate Hz | 48000 Hz | - |
| Channels | $channels | 2 (stereo) | - |
| Codec | $codec | - | - |

**Overall Status:** $overall_pass

EOF
}

# Analyze master mix
echo "## Master Mix" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
analyze_audio "$AUDIO_DIR/master_mix.wav" "master_mix.wav"

# Analyze master without coda (if exists)
if [ -f "$AUDIO_DIR/master_no-coda.wav" ]; then
    echo "" >> "$REPORT_FILE"
    analyze_audio "$AUDIO_DIR/master_no-coda.wav" "master_no-coda.wav"
fi

# Analyze stems
echo "" >> "$REPORT_FILE"
echo "## Stem Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for stem in drums bass harmony melody fx vox; do
    stem_file="$AUDIO_DIR/stems/${stem}.wav"
    analyze_audio "$stem_file" "${stem}.wav"
    echo "" >> "$REPORT_FILE"
done

# Analyze preview MP3
echo "## Preview File" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
analyze_audio "$AUDIO_DIR/audition/master_preview.mp3" "master_preview.mp3"

# Phase correlation check for master
echo "" >> "$REPORT_FILE"
echo "## Phase Correlation" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "$AUDIO_DIR/master_mix.wav" ]; then
    echo "Checking phase correlation..."
    phase_corr=$(ffmpeg -i "$AUDIO_DIR/master_mix.wav" -af aphasemeter=video=0:phasing=1 -f null - 2>&1 | \
        grep "Phase:" | tail -1 | awk '{print $2}')

    phase_status="❌"
    if (( $(echo "$phase_corr > 0.3" | bc -l) )); then
        phase_status="✅"
    fi

    cat >> "$REPORT_FILE" << EOF
| File | Phase Correlation | Minimum | Status |
|------|------------------|---------|--------|
| master_mix.wav | $phase_corr | > 0.3 | $phase_status |

EOF
fi

# Null test (stems vs master)
echo "## Stem Summation Test" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "$AUDIO_DIR/master_mix.wav" ] && [ -d "$AUDIO_DIR/stems" ]; then
    echo "Performing null test..."

    # Sum all stems
    ffmpeg -i "$AUDIO_DIR/stems/drums.wav" \
           -i "$AUDIO_DIR/stems/bass.wav" \
           -i "$AUDIO_DIR/stems/harmony.wav" \
           -i "$AUDIO_DIR/stems/melody.wav" \
           -i "$AUDIO_DIR/stems/fx.wav" \
           -i "$AUDIO_DIR/stems/vox.wav" \
           -filter_complex "amix=inputs=6:duration=longest" \
           -y "$TEMP_DIR/stems_sum.wav" 2>/dev/null

    # Invert and mix with master for null test
    ffmpeg -i "$AUDIO_DIR/master_mix.wav" \
           -i "$TEMP_DIR/stems_sum.wav" \
           -filter_complex "[1]aeval=-val(0)|0[inv];[0][inv]amix=inputs=2:duration=shortest" \
           -y "$TEMP_DIR/null_test.wav" 2>/dev/null

    # Measure null test result
    null_level=$(ffmpeg -i "$TEMP_DIR/null_test.wav" -af "volumedetect" -f null - 2>&1 | \
        grep "max_volume" | awk '{print $5}')

    null_status="❌"
    if (( $(echo "$null_level < -60" | bc -l) )); then
        null_status="✅"
    fi

    cat >> "$REPORT_FILE" << EOF
**Null Test Result:** $null_level dB
**Status:** $null_status (should be < -60 dB for perfect null)

EOF
else
    echo "**Null Test:** Skipped (files not found)" >> "$REPORT_FILE"
fi

# Summary
echo "" >> "$REPORT_FILE"
echo "## QC Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count pass/fail
pass_count=$(grep -c "Overall Status: PASS" "$REPORT_FILE" || true)
fail_count=$(grep -c "Overall Status: FAIL" "$REPORT_FILE" || true)
total_count=$((pass_count + fail_count))

if [ $fail_count -eq 0 ]; then
    summary_status="✅ ALL CHECKS PASSED"
    echo -e "${GREEN}$summary_status${NC}"
else
    summary_status="⚠️ ISSUES FOUND"
    echo -e "${YELLOW}$summary_status${NC}"
fi

cat >> "$REPORT_FILE" << EOF
**Files Analyzed:** $total_count
**Passed:** $pass_count
**Failed:** $fail_count
**Overall QC Status:** $summary_status

### Compliance Notes
- Integrated loudness should be within -15 to -13 LUFS
- True peak must not exceed -1.0 dBTP
- Phase correlation should be > 0.3 for stereo compatibility
- Stems should null perfectly with master (< -60 dB)

---

**Report Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Tool:** FFmpeg EBU R128 loudness filter
**Standard:** EBU R128 / ITU-R BS.1770-4

EOF

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "📊 Audio QC complete!"
echo "Report saved to: $REPORT_FILE"

# Exit with error if any files failed
if [ $fail_count -gt 0 ]; then
    exit 1
fi

exit 0