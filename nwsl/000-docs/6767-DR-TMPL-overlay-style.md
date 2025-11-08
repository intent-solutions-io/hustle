# Overlay Style Guide - MASTER TEMPLATE
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Typography and animation specifications for all text overlays
**Standard:** Production-ready specifications for FFmpeg implementation

---

## GLOBAL TYPOGRAPHY SPECIFICATIONS

### Primary Text Style
- **Font Family:** Helvetica Neue Medium
- **Fallback Font:** Arial Bold
- **Size:** 48px @ 1920×1080
- **Color:** #FFFFFF (pure white)
- **Stroke:** 2px solid #000000 (black)
- **Stroke Opacity:** 100%
- **Letter Spacing:** 0.02em
- **Line Height:** 1.2

### Text Rendering
- **Anti-aliasing:** Enabled
- **Subpixel Rendering:** On
- **Hinting:** Full
- **Weight Adjustment:** None (use font's native weight)

---

## POSITIONING STANDARDS

### Lower Third Safe Zone
- **X Position:** Center aligned (960px from left @ 1920 width)
- **Y Position:** 85% from top (918px @ 1080 height)
- **Safe Margin Left:** 10% (192px)
- **Safe Margin Right:** 10% (192px)
- **Maximum Width:** 80% of screen (1536px)
- **Text Alignment:** Center

### Multi-line Handling
- **Line Spacing:** 1.2× font size (58px)
- **Maximum Lines:** 3
- **Overflow:** Word wrap with hyphenation disabled
- **Orphan Control:** Minimum 3 words per line

---

## BACKGROUND TREATMENT

### Gradient Specification
- **Type:** Linear gradient
- **Direction:** 0° (horizontal)
- **Start Color:** rgba(0, 0, 0, 0.0)
- **Mid Color:** rgba(0, 0, 0, 0.5) @ 30%
- **End Color:** rgba(0, 0, 0, 0.0) @ 100%
- **Height:** 120px
- **Width:** Full screen (1920px)
- **Position:** Behind text, centered on baseline
- **Blur:** 4px Gaussian

### Shadow Effects
- **Drop Shadow:** 2px 2px 4px rgba(0, 0, 0, 0.8)
- **Outer Glow:** None
- **Inner Shadow:** None

---

## ANIMATION SPECIFICATIONS

### Fade In
- **Duration:** 200ms
- **Easing:** ease-out (cubic-bezier(0, 0, 0.2, 1))
- **Opacity Curve:** 0% to 100%
- **Position:** Static (no slide)
- **Scale:** 100% throughout

### Hold Duration
- **Minimum:** 1000ms
- **Variable:** As specified in segment timing
- **Opacity:** 100% throughout hold

### Fade Out
- **Duration:** 150ms
- **Easing:** ease-in (cubic-bezier(0.4, 0, 1, 1))
- **Opacity Curve:** 100% to 0%
- **Position:** Static (no slide)
- **Scale:** 100% throughout

---

## SPECIAL ELEMENTS

### Dollar Amount Display
**CRITICAL:** All dollar amounts MUST be escaped
```bash
# CORRECT - Dollar sign escaped
drawtext=text='Spent \$30 million+ on women'\''s soccer'

# WRONG - Will display as "Spent  million+"
drawtext=text='Spent $30 million+ on women's soccer'
```

### Watermark Specification
- **Text:** @asphaltcowb0y
- **Font:** Helvetica Neue Light (or Arial)
- **Size:** 24px @ 1920×1080
- **Color:** #FFFFFF
- **Opacity:** 40%
- **Position:** Bottom right (X: 90%, Y: 95%)
- **Duration:** Entire video
- **Animation:** None (static)

---

## FFMPEG IMPLEMENTATION

### Basic Overlay Command
```bash
ffmpeg -i input.mp4 -vf "
drawtext=fontfile='/usr/share/fonts/HelveticaNeue-Medium.ttf':
text='OVERLAY TEXT HERE':
fontsize=48:
fontcolor=white:
borderw=2:
bordercolor=black:
x=(w-text_w)/2:
y=h*0.85:
enable='between(t,START,END)':
alpha='if(lt(t,START+0.2),(t-START)/0.2,if(gt(t,END-0.15),1-(t-END+0.15)/0.15,1))'
" output.mp4
```

### Gradient Background Layer
```bash
# Apply gradient behind text (requires complex filtergraph)
[0:v]format=rgba,
colorkey=0x00FF00:0.01:0.1,
[bg];
[bg]drawbox=x=0:y=h*0.85-60:w=w:h=120:
color=black@0.5:t=fill
[text_bg];
```

---

## ACCESSIBILITY REQUIREMENTS

### Contrast Ratios
- **Primary Text to Background:** Minimum 7:1 (WCAG AAA)
- **With Semi-transparent Background:** Effective 4.5:1 minimum
- **Watermark:** 3:1 minimum (decorative element)

### Timing Considerations
- **Minimum Display Time:** 1.5× reading speed (60 words per minute)
- **Maximum Simultaneous Elements:** 1 primary + watermark
- **Clear Periods:** 500ms minimum between different overlays

---

## QUALITY CONTROL CHECKLIST

### Pre-Render Verification
- [ ] All dollar amounts properly escaped with backslash
- [ ] Font files available and paths verified
- [ ] Timing spreadsheet matches segment durations
- [ ] No overlapping overlay periods
- [ ] Watermark opacity set to 40%

### Post-Render Verification
- [ ] Text fully visible and readable
- [ ] No clipping at screen edges
- [ ] Animations smooth without stuttering
- [ ] Dollar amounts display correctly
- [ ] Gradient backgrounds properly rendered

---

## SEGMENT-SPECIFIC OVERRIDES

### SEG-06: Medical Policy
- **Extended Display Time:** +500ms for policy text
- **Font Size:** 44px (slightly smaller for longer text)
- **Line Spacing:** 1.15× (tighter for 3 lines)

### SEG-08: Final Question
- **Font Weight:** Bold (Helvetica Neue Bold)
- **Size:** 52px (larger for impact)
- **Hold Duration:** Until end of video

---

## TECHNICAL SPECIFICATIONS

### Color Space
- **Working Space:** sRGB
- **Video Space:** Rec.709
- **Bit Depth:** 8-bit per channel
- **Alpha Channel:** Supported for overlays

### Performance Optimization
- **Pre-render:** Text to transparent PNG sequences when possible
- **Caching:** Enable glyph caching in FFmpeg
- **Hardware Acceleration:** Use where available for compositing

---

## ERROR PREVENTION

### Common Mistakes to Avoid
1. **Unescaped Dollar Signs:** Always use \$ not $
2. **Wrong Font Paths:** Verify font file locations
3. **Timing Overlap:** Check enable periods don't overlap
4. **Opacity Conflicts:** Ensure fade math is correct
5. **Position Overflow:** Test with longest text strings

### Validation Commands
```bash
# Test overlay without encoding (fast preview)
ffplay -vf "drawtext=text='TEST \$30 MILLION':..."

# Verify font availability
fc-list | grep -i helvetica

# Check overlay timing
ffprobe -show_entries frame=pkt_pts_time -of csv overlay_test.mp4
```

---

## REFERENCE IMPLEMENTATION

See `050-scripts/ffmpeg_overlay_pipeline.sh` for complete implementation with:
- All segment overlays properly timed
- Dollar escaping verified
- Gradient backgrounds applied
- Watermark consistently placed
- Animation curves implemented

---

**Document Type:** MASTER TEMPLATE
**Status:** Production Ready
**Last Updated:** 2025-11-07

**END OF OVERLAY STYLE GUIDE**