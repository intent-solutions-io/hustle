#!/bin/bash
# generate_checksums.sh - Generate MD5 and SHA256 checksums for all deliverables
# Phase 5 - Final package integrity verification

set -e

# CI-only enforcement
source ./gate.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔐 Generating package checksums..."
echo ""

# Create checksums directory
mkdir -p 060-renders/archive

# Output files
MD5_FILE="060-renders/archive/checksums.md5"
SHA256_FILE="060-renders/archive/checksums.sha256"
MANIFEST="060-renders/archive/package_manifest.txt"

# Initialize files
echo "# MD5 Checksums for 'Why Won't They Answer?'" > "$MD5_FILE"
echo "# Generated: $(date '+%Y-%m-%d %H:%M:%S')" >> "$MD5_FILE"
echo "" >> "$MD5_FILE"

echo "# SHA256 Checksums for 'Why Won't They Answer?'" > "$SHA256_FILE"
echo "# Generated: $(date '+%Y-%m-%d %H:%M:%S')" >> "$SHA256_FILE"
echo "" >> "$SHA256_FILE"

echo "# Package Manifest for 'Why Won't They Answer?'" > "$MANIFEST"
echo "# Generated: $(date '+%Y-%m-%d %H:%M:%S')" >> "$MANIFEST"
echo "" >> "$MANIFEST"

# Function to generate checksums for a file
generate_checksums() {
    local file="$1"
    local category="$2"

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Processing: $file"

        # Get file info
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
        size_mb=$(echo "scale=2; $size / 1048576" | bc)

        # Generate checksums
        md5sum=$(md5sum "$file" 2>/dev/null || md5 "$file" 2>/dev/null | awk '{print $NF}')
        sha256sum=$(sha256sum "$file" 2>/dev/null || shasum -a 256 "$file" 2>/dev/null | awk '{print $1}')

        # Write to files
        echo "# $category" >> "$MD5_FILE"
        echo "$md5sum  $file" >> "$MD5_FILE"

        echo "# $category" >> "$SHA256_FILE"
        echo "$sha256sum  $file" >> "$SHA256_FILE"

        echo "[$category] $file (${size_mb}MB)" >> "$MANIFEST"

        return 0
    else
        echo -e "${YELLOW}⚠${NC}  Missing: $file"
        echo "# [MISSING] $category: $file" >> "$MANIFEST"
        return 1
    fi
}

echo "📦 Checking deliverables..."
echo ""

# Video segments (if they exist)
echo "=== VIDEO SEGMENTS ===" >> "$MANIFEST"
for i in {01..08}; do
    generate_checksums "030-video/shots/SEG-${i}_best.mp4" "Video Segment $i" || true
done
echo "" >> "$MANIFEST"

# Audio files
echo "=== AUDIO FILES ===" >> "$MANIFEST"
generate_checksums "020-audio/music/master_mix.wav" "Lyria Master Score" || true
generate_checksums "020-audio/music/master_normalized.wav" "Normalized Audio" || true
echo "" >> "$MANIFEST"

# Final renders
echo "=== FINAL RENDERS ===" >> "$MANIFEST"
generate_checksums "060-renders/final/why_wont_they_answer_master.mp4" "Master Export" || true
generate_checksums "060-renders/final/why_no_music.mp4" "No Music Version" || true
generate_checksums "060-renders/final/why_no_overlays.mp4" "No Overlays Version" || true
generate_checksums "060-renders/final/thumbnail.jpg" "Thumbnail Image" || true
echo "" >> "$MANIFEST"

# Social versions
echo "=== SOCIAL VERSIONS ===" >> "$MANIFEST"
generate_checksums "060-renders/social/why_vertical_9x16.mp4" "Vertical (TikTok/Reels)" || true
generate_checksums "060-renders/social/why_square_1x1.mp4" "Square (Instagram)" || true
generate_checksums "060-renders/social/why_twitter_optimized.mp4" "Twitter/X Optimized" || true
echo "" >> "$MANIFEST"

# Archive version
echo "=== ARCHIVE ===" >> "$MANIFEST"
generate_checksums "060-renders/archive/why_prores_422hq.mov" "ProRes Master" || true
echo "" >> "$MANIFEST"

# Documentation
echo "=== DOCUMENTATION ===" >> "$MANIFEST"
generate_checksums "docs/6767-PP-PROD-master-brief.md" "Master Brief" || true
generate_checksums "docs/6767-DR-TMPL-overlay-style.md" "Overlay Style Guide" || true
generate_checksums "docs/036-DD-DATA-overlay-map.csv" "Overlay Timing Map" || true
generate_checksums "docs/037-OD-SPEC-export-specifications.md" "Export Specifications" || true
echo "" >> "$MANIFEST"

# Scripts
echo "=== SCRIPTS ===" >> "$MANIFEST"
generate_checksums "050-scripts/ffmpeg_overlay_pipeline.sh" "Overlay Pipeline" || true
generate_checksums "050-scripts/video_qc.sh" "Video QC Script" || true
generate_checksums "050-scripts/audio_qc.sh" "Audio QC Script" || true
echo "" >> "$MANIFEST"

# Subtitle files
echo "=== SUBTITLES ===" >> "$MANIFEST"
generate_checksums "040-overlays/why_overlays.ass" "ASS Subtitle File" || true
generate_checksums "040-overlays/why_overlays.srt" "SRT Subtitle File" || true
echo "" >> "$MANIFEST"

echo ""
echo "📋 Creating verification script..."

# Create verification script
cat > "060-renders/archive/verify_checksums.sh" << 'VERIFY_SCRIPT'
#!/bin/bash
# Verify package integrity

echo "🔍 Verifying package checksums..."
echo ""

# Verify MD5
if command -v md5sum >/dev/null 2>&1; then
    echo "Checking MD5..."
    md5sum -c checksums.md5 2>/dev/null | grep -v "^#"
else
    echo "MD5 verification skipped (md5sum not available)"
fi

echo ""

# Verify SHA256
if command -v sha256sum >/dev/null 2>&1; then
    echo "Checking SHA256..."
    sha256sum -c checksums.sha256 2>/dev/null | grep -v "^#"
elif command -v shasum >/dev/null 2>&1; then
    echo "Checking SHA256..."
    shasum -a 256 -c checksums.sha256 2>/dev/null | grep -v "^#"
else
    echo "SHA256 verification skipped (no tool available)"
fi

echo ""
echo "✅ Verification complete!"
VERIFY_SCRIPT

chmod +x "060-renders/archive/verify_checksums.sh"

# Generate summary
echo ""
echo "📊 Checksum Generation Summary"
echo "================================"
echo ""

# Count files processed
total_files=$(grep -c "^\[" "$MANIFEST" 2>/dev/null || echo "0")
missing_files=$(grep -c "MISSING" "$MANIFEST" 2>/dev/null || echo "0")
processed_files=$((total_files - missing_files))

echo "Files processed: $processed_files"
echo "Files missing: $missing_files"
echo ""

echo "📁 Output files:"
echo "  - MD5 checksums: $MD5_FILE"
echo "  - SHA256 checksums: $SHA256_FILE"
echo "  - Package manifest: $MANIFEST"
echo "  - Verification script: 060-renders/archive/verify_checksums.sh"
echo ""

# Create integrity report
INTEGRITY_REPORT="060-renders/archive/integrity_report.txt"
cat > "$INTEGRITY_REPORT" << EOF
PACKAGE INTEGRITY REPORT
========================
Project: Why Won't They Answer?
Generated: $(date '+%Y-%m-%d %H:%M:%S')

Files Processed: $processed_files
Files Missing: $missing_files
Total Expected: $total_files

Checksum Algorithms:
- MD5: Generated
- SHA256: Generated

Verification:
To verify package integrity, run:
  cd 060-renders/archive/
  ./verify_checksums.sh

Critical Files Status:
- Master video: $([ -f "060-renders/final/why_wont_they_answer_master.mp4" ] && echo "✓ Present" || echo "✗ Missing")
- Lyria score: $([ -f "020-audio/music/master_mix.wav" ] && echo "✓ Present" || echo "✗ Missing")
- Overlay script: $([ -f "050-scripts/ffmpeg_overlay_pipeline.sh" ] && echo "✓ Present" || echo "✗ Missing")

Notes:
- All dollar amounts must display correctly (\$30 million, \$117 million)
- No human voices should be present in any audio
- Watermark should appear at 40% opacity throughout

END OF REPORT
EOF

echo "📄 Integrity report saved to: $INTEGRITY_REPORT"
echo ""

if [ $missing_files -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: $missing_files files are missing${NC}"
    echo "This is expected if render has not been completed yet."
else
    echo -e "${GREEN}✅ All expected files have checksums generated${NC}"
fi

echo ""
echo "🔐 Checksum generation complete!"