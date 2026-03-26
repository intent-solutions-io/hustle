#!/bin/bash
# DOWNLOAD ALL READY SEGMENTS FROM CLOUD STORAGE
set -euo pipefail

BUCKET="gs://pipelinepilot-prod-veo-videos"
OUTPUT_DIR="/home/jeremy/000-projects/hustle/nwsl/003-raw-segments"
LOGS_DIR="/home/jeremy/000-projects/hustle/nwsl/007-logs/generation"

mkdir -p "$OUTPUT_DIR"
mkdir -p "$LOGS_DIR"

LOGFILE="${LOGS_DIR}/download_$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
}

log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $*" | tee -a "$LOGFILE"
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $*" | tee -a "$LOGFILE"
}

log "════════════════════════════════════════════════════════════════"
log "DOWNLOAD READY SEGMENTS"
log "════════════════════════════════════════════════════════════════"
log ""

DOWNLOADED=0
SKIPPED=0
FAILED=0

for seg_id in 01 02 03 04 05 06 07 08; do
    OUTPUT_FILE="${OUTPUT_DIR}/SEG-${seg_id}.mp4"

    # Skip if already downloaded
    if [ -f "$OUTPUT_FILE" ]; then
        log "⏭️  SEG-${seg_id} already exists, skipping"
        ((SKIPPED++))
        continue
    fi

    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "DOWNLOADING SEG-${seg_id}"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Find video in cloud storage
    VIDEO_PATH=$(gsutil ls "${BUCKET}/seg${seg_id}_explicit/**/*.mp4" 2>/dev/null | head -1 || true)

    if [ -z "$VIDEO_PATH" ]; then
        log_error "SEG-${seg_id} not found in cloud storage"
        ((FAILED++))
        continue
    fi

    log "📥 Downloading from: $VIDEO_PATH"

    # Download
    if gsutil cp "$VIDEO_PATH" "$OUTPUT_FILE" 2>&1 | tee -a "$LOGFILE"; then
        log_success "Downloaded to: $OUTPUT_FILE"

        # Get file info
        size=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
        duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE" 2>/dev/null || echo "unknown")

        log "   Size: $(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size} bytes")"
        log "   Duration: ${duration}s"

        # Extract preview frame
        PREVIEW="${OUTPUT_DIR}/SEG-${seg_id}_preview.png"
        if ffmpeg -y -ss $(awk "BEGIN {print $duration / 2}" 2>/dev/null || echo 2) -i "$OUTPUT_FILE" -frames:v 1 "$PREVIEW" 2>&1 | tee -a "$LOGFILE"; then
            log "📸 Preview: $PREVIEW"
        fi

        ((DOWNLOADED++))
    else
        log_error "Failed to download SEG-${seg_id}"
        ((FAILED++))
    fi
done

log ""
log "════════════════════════════════════════════════════════════════"
log "DOWNLOAD SUMMARY"
log "════════════════════════════════════════════════════════════════"
log "✅ Downloaded: $DOWNLOADED segments"
log "⏭️  Skipped (already exist): $SKIPPED segments"
log "❌ Failed: $FAILED segments"
log ""
log "Total completed: $((DOWNLOADED + SKIPPED))/8 segments"
log ""
log "Output directory: $OUTPUT_DIR"
log "Log file: $LOGFILE"
log ""

if [ $((DOWNLOADED + SKIPPED)) -eq 8 ]; then
    log_success "ALL SEGMENTS DOWNLOADED! 🎉"
    exit 0
elif [ $FAILED -gt 0 ]; then
    log_error "Some segments failed to download"
    exit 1
else
    log "⏳ Some segments still processing"
    exit 2
fi
