#!/bin/bash
# NWSL Workspace Organization Script
set -e

echo "🧹 NWSL WORKSPACE ORGANIZATION"
echo "==============================="
echo ""

# Kill any remaining ffmpeg processes
pkill ffmpeg 2>/dev/null || true

echo "📂 Current structure:"
echo "--------------------"
ls -la

echo ""
echo "🗂️ Creating organized structure..."

# 1. MASTER OUTPUTS - Final deliverables
mkdir -p 001-master-outputs
mv -f 060-renders/nwsl_master_transitions.mp4 001-master-outputs/master_v1_transitions_68s.mp4 2>/dev/null || true
mv -f 060-renders/nwsl_master_16x9.mp4 001-master-outputs/master_v0_no_transitions_72s.mp4 2>/dev/null || true
mv -f 060-renders/nwsl_9segments_raw.mp4 001-master-outputs/raw_concatenated_72s.mp4 2>/dev/null || true

# 2. VIDEO SEGMENTS - All generated segments
mkdir -p 002-video-segments/{original,silent,bridges}
mv -f 030-video/shots/SEG-*.mp4 002-video-segments/original/ 2>/dev/null || true
mv -f 030-video/silent/SEG-*.mp4 002-video-segments/silent/ 2>/dev/null || true
mv -f 030-video/silent/BR-*.mp4 002-video-segments/bridges/ 2>/dev/null || true
mv -f 030-video/bridges/*.mp4 002-video-segments/bridges/ 2>/dev/null || true

# 3. AUDIO ASSETS
mkdir -p 003-audio-assets
mv -f 020-audio/music/*.wav 003-audio-assets/ 2>/dev/null || true

# 4. SCRIPTS - All generation and assembly scripts
mkdir -p 004-scripts/{generation,assembly,tests,archive}
mv -f generate_*.sh 004-scripts/generation/ 2>/dev/null || true
mv -f assemble_*.sh 004-scripts/assembly/ 2>/dev/null || true
mv -f test_*.sh 004-scripts/tests/ 2>/dev/null || true
mv -f regenerate_*.sh 004-scripts/tests/ 2>/dev/null || true
mv -f veo_render.sh 004-scripts/archive/ 2>/dev/null || true

# 5. CANON DOCUMENTS - Source prompts
mkdir -p 005-canon-docs
cp -r 000-docs/*.md 005-canon-docs/ 2>/dev/null || true
cp -r nwsl-canonical-content/*.md 005-canon-docs/ 2>/dev/null || true

# 6. TEMP/ARCHIVE - Old attempts
mkdir -p 006-archive/{old-renders,temp-files,logs}
mv -f segments/ 006-archive/old-renders/ 2>/dev/null || true
mv -f /tmp/seg*.json 006-archive/temp-files/ 2>/dev/null || true
mv -f /tmp/BR-*.json 006-archive/temp-files/ 2>/dev/null || true
mv -f *.log 006-archive/logs/ 2>/dev/null || true
mv -f vertex_ops.log 006-archive/logs/ 2>/dev/null || true

# Clean up empty directories
rmdir 020-audio/music 020-audio 2>/dev/null || true
rmdir 030-video/shots 030-video/silent 030-video/bridges 030-video 2>/dev/null || true
rmdir 060-renders 2>/dev/null || true
rmdir 070-logs 2>/dev/null || true

echo ""
echo "📊 Workspace Inventory:"
echo "----------------------"

echo ""
echo "✅ 001-master-outputs/ (Final videos)"
ls -lh 001-master-outputs/ 2>/dev/null || echo "  Empty"

echo ""
echo "🎬 002-video-segments/ (All segments)"
echo "  Original segments:"
ls -lh 002-video-segments/original/SEG-*.mp4 2>/dev/null | wc -l | xargs echo "    Count:"
echo "  Silent segments:"
ls -lh 002-video-segments/silent/SEG-*.mp4 2>/dev/null | wc -l | xargs echo "    Count:"
echo "  Bridge shots:"
ls -lh 002-video-segments/bridges/BR-*.mp4 2>/dev/null | wc -l | xargs echo "    Count:"

echo ""
echo "🎵 003-audio-assets/"
ls -lh 003-audio-assets/ 2>/dev/null || echo "  Empty"

echo ""
echo "📜 004-scripts/"
echo "  Generation scripts: $(ls 004-scripts/generation/*.sh 2>/dev/null | wc -l)"
echo "  Assembly scripts: $(ls 004-scripts/assembly/*.sh 2>/dev/null | wc -l)"
echo "  Test scripts: $(ls 004-scripts/tests/*.sh 2>/dev/null | wc -l)"

echo ""
echo "📚 005-canon-docs/"
echo "  Canon files: $(ls 005-canon-docs/*.md 2>/dev/null | wc -l)"

echo ""
echo "🗄️ 006-archive/"
ls -la 006-archive/ 2>/dev/null || echo "  Empty"

echo ""
echo "🧮 Space Usage:"
du -sh 001-master-outputs 2>/dev/null || echo "001-master-outputs: 0"
du -sh 002-video-segments 2>/dev/null || echo "002-video-segments: 0"
du -sh 003-audio-assets 2>/dev/null || echo "003-audio-assets: 0"
du -sh 004-scripts 2>/dev/null || echo "004-scripts: 0"
du -sh 005-canon-docs 2>/dev/null || echo "005-canon-docs: 0"
du -sh 006-archive 2>/dev/null || echo "006-archive: 0"

echo ""
echo "✅ WORKSPACE ORGANIZED!"
echo "======================"
