#!/usr/bin/env bash
# overlay_sync.sh - Sync overlay text canon to ASS format
set -euo pipefail

# Source dependencies
source ./gate.sh
: "${DOCS_DIR:=./docs}"

echo "🎬 Overlay Sync - Converting Canon to ASS Format"
echo "================================================"

# Canon and output paths
OVERLAY_CANON="${DOCS_DIR}/6767-DR-REFF-overlays-16x9.md"
OVERLAY_DIR="040-overlays"
OUTPUT_FILE="${OVERLAY_DIR}/overlays_16x9.ass"

# Ensure output directory exists
mkdir -p "$OVERLAY_DIR"

# Check for canon file
if [[ ! -f "$OVERLAY_CANON" ]]; then
    echo "❌ [FATAL] Missing overlay canon: $OVERLAY_CANON" >&2
    exit 1
fi

echo "📖 Reading overlay canon: $OVERLAY_CANON"

# Create ASS header
cat > "$OUTPUT_FILE" << 'EOF'
[Script Info]
Title: NWSL Documentary Overlays
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Helvetica Neue,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,40,40,40,1
Style: Title,Helvetica Neue,56,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,3,2,40,40,40,1
Style: Lower,Helvetica Neue,44,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,40,40,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
EOF

echo "📝 Converting overlay entries to ASS format..."

# Parse overlay canon and convert to ASS format
# Skip header lines and extract time ranges with text
awk '
    /^[0-9][0-9]:/ {
        # Parse time range and text
        if (match($0, /^([0-9][0-9]:[0-9][0-9]\.[0-9][0-9]) - ([0-9][0-9]:[0-9][0-9]\.[0-9][0-9])   (.*)$/, arr)) {
            start = arr[1]
            end = arr[2]
            text = arr[3]

            # Skip [no text] entries
            if (text != "[no text]") {
                # Convert time format (00:00.00 -> 0:00:00.00)
                gsub(/^0/, "", start)
                gsub(/^0/, "", end)
                start = "0:" start ":00"
                end = "0:" end ":00"

                # Determine style based on content
                style = "Default"
                if (index(text, "Commissioner") > 0) style = "Title"
                if (index(text, "million") > 0 || index(text, "Why") > 0) style = "Lower"

                # Output ASS dialogue line
                printf "Dialogue: 0,%s,%s,%s,,0,0,0,,%s\n", start, end, style, text
            }
        }
    }
' "$OVERLAY_CANON" >> "$OUTPUT_FILE"

# Validate output
if [[ ! -s "$OUTPUT_FILE" ]]; then
    echo "❌ [FATAL] Failed to create overlay file" >&2
    exit 1
fi

# Count overlays
OVERLAY_COUNT=$(grep -c "^Dialogue:" "$OUTPUT_FILE")

echo "✅ Overlay sync complete!"
echo "  📄 Output: $OUTPUT_FILE"
echo "  📊 Total overlays: $OVERLAY_COUNT"

# Display preview
echo ""
echo "📋 Preview of overlays:"
echo "======================="
grep "^Dialogue:" "$OUTPUT_FILE" | head -5
echo "..."

echo ""
echo "✨ Ready for overlay_build.sh"