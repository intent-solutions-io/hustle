#!/bin/bash
# Phase 1: Canon Integrity & Overlay Map Check
set -euo pipefail

echo "📚 PHASE 1: CANON INTEGRITY CHECK"
echo "=================================="
echo ""

# Initialize status
CANON_OK=true

# 1. Check segment canon files (004-011)
echo "📄 Checking segment canon files:"
for i in {4..11}; do
    idx=$(printf "%03d" $i)
    seg=$(printf "%02d" $((i-3)))
    canon_file="docs/${idx}-DR-REFF-veo-seg-${seg}.md"
    
    if [ -f "$canon_file" ]; then
        SIZE=$(wc -c < "$canon_file")
        echo "  ✅ SEG-${seg}: ${canon_file} (${SIZE} bytes)"
    else
        echo "  ❌ SEG-${seg}: ${canon_file} MISSING"
        CANON_OK=false
    fi
done
echo ""

# 2. Check overlay specifications
echo "📊 Checking overlay specifications:"
OVERLAY_SPEC="docs/6767-DR-REFF-overlays-16x9.md"
OVERLAY_MAP="docs/036-DD-DATA-overlay-map.csv"

if [ -f "$OVERLAY_SPEC" ]; then
    echo "  ✅ Overlay spec: $OVERLAY_SPEC"
else
    echo "  ❌ Overlay spec MISSING: $OVERLAY_SPEC"
    CANON_OK=false
fi

if [ -f "$OVERLAY_MAP" ]; then
    echo "  ✅ Overlay map: $OVERLAY_MAP"
else
    echo "  ❌ Overlay map MISSING: $OVERLAY_MAP"
    CANON_OK=false
fi
echo ""

# 3. Check audio score
echo "🎵 Checking audio score:"
SCORE_PATH="020-audio/music/master_mix.wav"
ALT_SCORE="003-audio-assets/master_mix.wav"

if [ -f "$SCORE_PATH" ]; then
    SIZE=$(ls -lh "$SCORE_PATH" | awk '{print $5}')
    echo "  ✅ Score found: $SCORE_PATH ($SIZE)"
elif [ -f "$ALT_SCORE" ]; then
    SIZE=$(ls -lh "$ALT_SCORE" | awk '{print $5}')
    echo "  ✅ Score found: $ALT_SCORE ($SIZE)"
    # Copy to expected location
    mkdir -p 020-audio/music
    cp "$ALT_SCORE" "$SCORE_PATH"
    echo "  📋 Copied to expected location"
else
    echo "  ❌ Score MISSING: $SCORE_PATH"
    CANON_OK=false
fi
echo ""

# 4. Check negative artifacts guide (optional but useful)
echo "🚫 Checking negative artifacts guide:"
NEG_GUIDE="docs/6767-DR-REFF-veo-negative-artifacts.md"
if [ -f "$NEG_GUIDE" ]; then
    echo "  ✅ Negative guide: $NEG_GUIDE"
else
    echo "  ⚠️ Negative guide not found (optional): $NEG_GUIDE"
fi
echo ""

# 5. Generate inventory
echo "📋 Canon Inventory:"
ls -la docs/*.md 2>/dev/null | wc -l | xargs echo "  Total MD files in docs:"
ls -la docs/*DR-REFF*.md 2>/dev/null | wc -l | xargs echo "  Reference docs:"
ls -la docs/*DD-DATA*.csv 2>/dev/null | wc -l | xargs echo "  Data files:"
echo ""

# Check result
if [ "$CANON_OK" = true ]; then
    echo "✅ PHASE 1 COMPLETE - All canon verified"
else
    echo "❌ PHASE 1 FAILED - Missing canon files"
    exit 1
fi
