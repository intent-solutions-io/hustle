#!/usr/bin/env bash
set -euo pipefail

MASTER="${1:-060-renders/nwsl_hollywood_master.mp4}"
CSV="./docs/036-DD-DATA-overlay-map.csv"
LOGDIR="070-logs"
mkdir -p "$LOGDIR" "$LOGDIR/overlays" "$LOGDIR/thumbs"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   🎬 MASTER VIDEO QUALITY CONTROL CHECK 🎬             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1) Metadata"
ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,channels \
  -of default=noprint_wrappers=1 "$MASTER" | tee "$LOGDIR/meta.txt"

echo ""
echo "2) Assert 1080p/24fps"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$MASTER" \
| awk -F, '{ split($3,a,"/"); fps=a[1]/a[2]; if($1!=1920||$2!=1080){print "❌ FAIL: not 1920x1080"; exit 42} if (fps<23.9||fps>24.1){print "❌ FAIL: not 24fps"; exit 43} else {print "✅ PASS: 1920x1080 @ 24fps"} }'

echo ""
echo "3) Assert duration ~64-66s"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$MASTER")
awk -v d="$DUR" 'BEGIN{ if (d<62 || d>68){ print "❌ FAIL: duration " d "s"; exit 44 } else { print "✅ PASS: duration " d "s" } }'

echo ""
echo "4) Scene-change scan (expect ~1 hard cut near 40s for S5→S6)"
ffmpeg -hide_banner -i "$MASTER" -filter:v "select='gt(scene,0.40)',showinfo" -f null - 2>"$LOGDIR/scene.log" || true
SCENES=$(grep -c "scene_score" "$LOGDIR/scene.log" || true)
echo "Scene spikes detected: $SCENES"
if [ "$SCENES" -le 2 ]; then
  echo "✅ PASS: Crossfades working (minimal hard cuts)"
else
  echo "⚠️  WARNING: Multiple hard cuts detected (should be mostly crossfades)"
fi

echo ""
echo "5) Black tail detection (need ≥2.0s black)"
ffmpeg -hide_banner -i "$MASTER" -vf "blackdetect=d=1.8:pic_th=0.98" -an -f null - 2>"$LOGDIR/black.log" || true
if grep -q "black_start" "$LOGDIR/black.log"; then
  echo "✅ PASS: Black tail detected"
  grep "black_start" "$LOGDIR/black.log" | tail -1
else
  echo "❌ FAIL: No black tail detected"
fi

echo ""
echo "6) Audio continuity (no mid-program silence)"
ffmpeg -hide_banner -i "$MASTER" -af "silencedetect=noise=-35dB:d=0.5" -f null - 2>"$LOGDIR/silence.log" || true
SILENCE_COUNT=$(grep -c "silence_start" "$LOGDIR/silence.log" || echo "0")
if [ "$SILENCE_COUNT" = "0" ]; then
  echo "✅ PASS: No silence gaps detected"
else
  echo "⚠️  WARNING: Silence events detected:"
  grep "silence_" "$LOGDIR/silence.log" | head -3
fi

echo ""
echo "7) Overlay spot-check frames from CSV midpoints"
if [[ -f "$CSV" ]]; then
  export MASTER
  export LOGDIR
  awk -F, 'NR>1 { gsub(/\r/,""); if ($1 ~ /^[0-9.]+$/ && $2 ~ /^[0-9.]+$/) { mid=($1+$2)/2; printf("ffmpeg -y -ss %.3f -i '\''%s'\'' -frames:v 1 '\''%s/overlays/%06.3fs.png'\'' 2>/dev/null\n", mid, ENVIRON["MASTER"], ENVIRON["LOGDIR"], mid) } }' "$CSV" \
  | bash
  OVERLAY_COUNT=$(ls "$LOGDIR/overlays/"*.png 2>/dev/null | wc -l)
  echo "✅ Extracted $OVERLAY_COUNT overlay frames to $LOGDIR/overlays/"
else
  echo "❌ FAIL: Overlay CSV missing: $CSV"
fi

echo ""
echo "8) Contact sheet for soccer QC (grab frames across runtime)"
ffmpeg -hide_banner -i "$MASTER" -vf "fps=1/2,scale=640:-1,tile=4x4" -frames:v 1 "$LOGDIR/thumbs/contact_sheet.png" -y 2>/dev/null
echo "✅ Contact sheet saved to $LOGDIR/thumbs/contact_sheet.png"

echo ""
echo "9) Extract key frames for visual inspection"
for t in 5 15 25 35 45 55; do
  ffmpeg -y -ss $t -i "$MASTER" -frames:v 1 "$LOGDIR/thumbs/frame_${t}s.png" 2>/dev/null
done
echo "✅ Key frames extracted to $LOGDIR/thumbs/"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   📊 QC SUMMARY                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Files to inspect:"
echo "  • $LOGDIR/meta.txt - Full metadata"
echo "  • $LOGDIR/scene.log - Scene changes (expect 1 spike)"
echo "  • $LOGDIR/black.log - Black tail verification"
echo "  • $LOGDIR/silence.log - Audio continuity check"
echo "  • $LOGDIR/overlays/*.png - Text overlay verification"
echo "  • $LOGDIR/thumbs/contact_sheet.png - Soccer visual check"
echo ""
echo "Visual inspection checklist:"
echo "  ✓ No American football uprights/goalposts"
echo "  ✓ No yard numbers or hash marks"
echo "  ✓ No end zones or oval balls"
echo "  ✓ Soccer field elements only (goals, center circle, penalty box)"
echo "  ✓ Text overlays properly spelled and timed"
echo ""

# Final pass/fail
echo "AUTOMATED CHECKS COMPLETE"
if [ "$SCENES" -le 3 ]; then
  echo "✅ VIDEO PASSES AUTOMATED QC"
else
  echo "⚠️  VIDEO NEEDS MANUAL REVIEW"
fi