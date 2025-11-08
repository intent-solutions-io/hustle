# Overlay Style Reference
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Quick reference for text overlay implementation
**Master Document:** docs/6767-DR-TMPL-overlay-style.md

---

## QUICK REFERENCE

### Typography
```
Font: Helvetica Neue Medium (or Arial Bold)
Size: 48px @ 1920×1080
Color: #FFFFFF (white)
Stroke: 2px black (#000000)
Position: Lower third (Y: 85%)
```

### Animation Timing
```
Fade In: 200ms ease-out
Hold: As specified per segment
Fade Out: 150ms ease-in
```

### Critical Escaping
```bash
\$ = Dollar sign (MUST ESCAPE)
'\'' = Single quote in bash
\" = Double quote if needed
```

---

## OVERLAY TIMING MATRIX

| Segment | Start | End | Text | Escaped Version |
|---------|-------|-----|------|-----------------|
| SEG-02 | 0:10 | 0:11 | Jessica Berman — Commissioner | Standard text |
| SEG-02 | 0:13 | 0:14 | Board of Governors controls | Standard text |
| SEG-03 | 0:17 | 0:18 | Michele Kang - Washington Spirit | Standard text |
| SEG-03 | 0:20 | 0:21 | Spent $30 million+ | `Spent \$30 million+` |
| SEG-03 | 0:22 | 0:22.5 | Why no answer? | Standard text |
| SEG-04 | 0:25 | 0:26 | Angie Long - Kansas City Current | Standard text |
| SEG-04 | 0:28 | 0:29 | Built a $117 million stadium | `Built a \$117 million stadium` |
| SEG-04 | 0:30 | 0:31 | ...only to let males play | Standard text |
| SEG-05 | 0:33 | 0:34 | The Wilf Family - Orlando Pride | Standard text |
| SEG-05 | 0:35 | 0:36 | What excuse will they use? | Standard text |
| SEG-05 | 0:37 | 0:38 | Money, probably. | Standard text |
| SEG-06 | 0:41 | 0:42 | NWSL Policy (2021) | Standard text |
| SEG-06 | 0:44 | 0:46 | Eligibility criteria | Standard text |
| SEG-06 | 0:46.5 | 0:47.5 | Suppression methods | Standard text |
| SEG-07 | 0:49 | 0:50 | Thousands of young girls... | Standard text |
| SEG-07 | 0:51 | 0:52 | Is it all about the money? | Standard text |
| SEG-07 | 0:54 | 0:55 | What happened to women... | Standard text |
| SEG-08 | 0:57 | 0:58 | Why won't you answer them? | Standard text |

---

## FFMPEG QUICK COMMANDS

### Single Overlay with Dollar Escape
```bash
drawtext=text='Spent \$30 million+ on women'\''s soccer':
fontfile='/usr/share/fonts/HelveticaNeue-Medium.ttf':
fontsize=48:fontcolor=white:borderw=2:bordercolor=black:
x=(w-text_w)/2:y=h*0.85:
enable='between(t,20,21)'
```

### Watermark (Persistent)
```bash
drawtext=text='@asphaltcowb0y':
fontsize=24:fontcolor=white@0.4:
x=w*0.9:y=h*0.95:
enable='gte(t,0)'
```

### Gradient Background
```bash
drawbox=x=0:y=h*0.85-60:w=w:h=120:
color=black@0.5:t=fill:
enable='between(t,START,END)'
```

---

## VALIDATION CHECKLIST

### Before Processing
- [ ] Verify all $ signs are escaped as \$
- [ ] Check font file paths exist
- [ ] Confirm overlay timings don't overlap
- [ ] Test with ffplay first

### During Processing
```bash
# Quick test single overlay
ffplay -i test.mp4 -vf "drawtext=text='TEST \$30 MILLION':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h*0.85"

# Verify escaping
echo "drawtext=text='Spent \$30 million+'" | grep '\$'
```

### After Processing
- [ ] All dollar amounts display correctly
- [ ] Text is readable against all backgrounds
- [ ] Animations are smooth
- [ ] Watermark visible at 40% opacity

---

## COMMON ISSUES & FIXES

| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing dollar amount | "$30" shows as "0" | Add backslash: \$30 |
| Text cut off | Words missing at edges | Reduce font size or adjust margins |
| Flickering text | Text appears/disappears rapidly | Check enable timing syntax |
| No text appears | Overlay missing entirely | Verify font path and enable clause |
| Watermark too bright | Distracting from content | Ensure @0.4 opacity set |

---

## SEGMENT-SPECIFIC NOTES

### SEG-03: Kang Investment
- Contains critical $30 million reference
- MUST escape dollar sign

### SEG-04: Long Stadium
- Contains $117 million reference
- MUST escape dollar sign

### SEG-06: Medical Policy
- Longer text requires 2 second display
- Consider smaller font (44px) if needed

### SEG-08: Final Question
- Bold font for emphasis
- Holds until video end

---

## EMERGENCY FIXES

### Dollar Sign Not Displaying
```bash
# WRONG
text='Spent $30 million'

# RIGHT
text='Spent \$30 million'
```

### Text Not Centered
```bash
# Force center alignment
x=(w-text_w)/2
```

### Overlay Too Long/Short
```bash
# Adjust enable window
enable='between(t,START_TIME,END_TIME)'
```

---

## PRODUCTION PIPELINE

1. **Generate ASS/SRT files** from timing matrix
2. **Test overlays** with ffplay on sample
3. **Apply to full video** with ffmpeg
4. **Quality check** each segment
5. **Final render** with all overlays

---

## CONTACT REFERENCE

- **Watermark:** @asphaltcowb0y (always at 40% opacity)
- **Font Fallbacks:** Helvetica → Arial → Sans-serif
- **Emergency Font:** Liberation Sans (always available)

---

**Quick Command for Full Pipeline:**
```bash
./050-scripts/ffmpeg_overlay_pipeline.sh input.mp4 output.mp4
```

---

**Reference Generated:** 2025-11-07
**For Full Specifications:** See docs/6767-DR-TMPL-overlay-style.md

**END OF REFERENCE**