# Imagen Styleboards Planning
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Visual reference frames for Veo conditioning and continuity enforcement

---

## STYLEBOARD MATRIX

| Seg | Visual Goal | Reference Images | Chosen Key Ref |
|-----|-------------|------------------|----------------|
| 1 | Youth soccer / golden hour / innocence | 001-assets/refs/imagen/SEG-01/SEG-01_ref-01.png<br>001-assets/refs/imagen/SEG-01/SEG-01_ref-02.png<br>001-assets/refs/imagen/SEG-01/SEG-01_ref-03.png | 001-assets/refs/imagen/SEG-01/SEG-01_ref-01.png |
| 2 | Executive power / cold office / governance | 001-assets/refs/imagen/SEG-02/SEG-02_ref-01.png<br>001-assets/refs/imagen/SEG-02/SEG-02_ref-02.png<br>001-assets/refs/imagen/SEG-02/SEG-02_ref-03.png | 001-assets/refs/imagen/SEG-02/SEG-02_ref-01.png |
| 3 | High finance / women's soccer investment | 001-assets/refs/imagen/SEG-03/SEG-03_ref-01.png<br>001-assets/refs/imagen/SEG-03/SEG-03_ref-02.png<br>001-assets/refs/imagen/SEG-03/SEG-03_ref-03.png | 001-assets/refs/imagen/SEG-03/SEG-03_ref-01.png |
| 4 | Purpose-built stadium / women's pro sports infrastructure | 001-assets/refs/imagen/SEG-04/SEG-04_ref-01.png<br>001-assets/refs/imagen/SEG-04/SEG-04_ref-02.png<br>001-assets/refs/imagen/SEG-04/SEG-04_ref-03.png | 001-assets/refs/imagen/SEG-04/SEG-04_ref-01.png |
| 5 | Wealth / boardroom math | 001-assets/refs/imagen/SEG-05/SEG-05_ref-01.png<br>001-assets/refs/imagen/SEG-05/SEG-05_ref-02.png<br>001-assets/refs/imagen/SEG-05/SEG-05_ref-03.png | 001-assets/refs/imagen/SEG-05/SEG-05_ref-01.png |
| 6 | Clinical policy / medical compliance | 001-assets/refs/imagen/SEG-06/SEG-06_ref-01.png<br>001-assets/refs/imagen/SEG-06/SEG-06_ref-02.png<br>001-assets/refs/imagen/SEG-06/SEG-06_ref-03.png | 001-assets/refs/imagen/SEG-06/SEG-06_ref-01.png |
| 7 | Confusion / impact on girls | 001-assets/refs/imagen/SEG-07/SEG-07_ref-01.png<br>001-assets/refs/imagen/SEG-07/SEG-07_ref-02.png<br>001-assets/refs/imagen/SEG-07/SEG-07_ref-03.png | 001-assets/refs/imagen/SEG-07/SEG-07_ref-01.png |
| 8 | Stare down / demand an answer | 001-assets/refs/imagen/SEG-08/SEG-08_ref-01.png<br>001-assets/refs/imagen/SEG-08/SEG-08_ref-02.png<br>001-assets/refs/imagen/SEG-08/SEG-08_ref-03.png | 001-assets/refs/imagen/SEG-08/SEG-08_ref-01.png |

---

## SEGMENT VISUAL BRIEFS

### Segment 1: The Innocence
**Key Ref:** SEG-01_ref-01.png
- **Palette:** Golden hour warmth, amber/orange tones
- **Composition:** Wide establishing shots with depth
- **Props:** Soccer balls, generic youth sports equipment
- **Wardrobe:** Generic athletic wear, no logos
- **Lighting:** Backlit, lens flares acceptable
- **Grade:** Warm, slightly desaturated for nostalgia

### Segment 2: The Commissioner
**Key Ref:** SEG-02_ref-01.png
- **Palette:** Cool corporate blues and grays
- **Composition:** Formal framing, symmetrical
- **Props:** Executive desk, generic office furniture
- **Wardrobe:** Professional business attire
- **Lighting:** Fluorescent office lighting (4300-4800K)
- **Grade:** Cool, slightly desaturated

### Segment 3: Kang - The Investment
**Key Ref:** SEG-03_ref-01.png
- **Palette:** Corporate neutrals with financial green accents
- **Composition:** Dynamic angles suggesting growth
- **Props:** Financial charts (generic), soccer imagery
- **Wardrobe:** Business professional
- **Lighting:** Mixed natural and office
- **Grade:** Neutral with slight warm push

### Segment 4: Long - The Stadium
**Key Ref:** SEG-04_ref-01.png
- **Palette:** Architectural grays, grass green
- **Composition:** Wide architectural shots, geometric
- **Props:** Stadium infrastructure (generic)
- **Wardrobe:** Construction/development context
- **Lighting:** Daylight, high contrast
- **Grade:** High contrast, architectural clarity

### Segment 5: Wilfs - The Money
**Key Ref:** SEG-05_ref-01.png
- **Palette:** Rich corporate colors, money green
- **Composition:** Power positions, low angles
- **Props:** Boardroom setting, financial displays
- **Wardrobe:** High-end business attire
- **Lighting:** Dramatic boardroom lighting
- **Grade:** Rich contrast, slightly darker

### Segment 6: The Policy - Medical
**Key Ref:** SEG-06_ref-01.png
- **Palette:** Clinical whites, medical greens
- **Composition:** Static, uncomfortable framing
- **Props:** Generic medical equipment
- **Wardrobe:** Medical/clinical attire
- **Lighting:** Harsh fluorescent (4200K with green tint)
- **Grade:** Cold, clinical, slight green cast

### Segment 7: The Confusion
**Key Ref:** SEG-07_ref-01.png
- **Palette:** Desaturated version of Segment 1
- **Composition:** Fragmented, off-balance
- **Props:** Same as Segment 1 but disheveled
- **Wardrobe:** Same athletic wear, but messier
- **Lighting:** Overcast, flat lighting
- **Grade:** Desaturated, lower contrast

### Segment 8: Unanswered Question
**Key Ref:** SEG-08_ref-01.png
- **Palette:** High contrast black and white tendency
- **Composition:** Extreme close-ups, confrontational
- **Props:** Minimal, focus on faces
- **Wardrobe:** Simple, non-distracting
- **Lighting:** Dramatic side lighting
- **Grade:** High contrast, almost monochromatic

---

## IMAGEN GENERATION PROMPTS

### For Each Segment Reference:
```
Style: Photorealistic documentary frame
Resolution: 1920×1080
Aspect: 16:9
Look: [Specific segment visual goal]
Avoid: Text, logos, identifiable people
Include: [Specific props and environment]
Lighting: [Specific lighting setup]
```

---

## CONDITIONING STRENGTH GUIDE

### Reference Strength Settings:
- **0.65** - Standard (default for all segments)
- **0.75** - When exact color match critical
- **0.55** - When allowing more variation
- **0.80** - For exact prop/wardrobe match

---

## IMPLEMENTATION WORKFLOW

1. **Generate Imagen References**
   - Create 3 styleframes per segment
   - Save to designated paths
   - Name consistently (SEG-0N_ref-XX.png)

2. **Select Key References**
   - Choose strongest composition
   - Verify no text/logos present
   - Confirm mood alignment

3. **Update Segment Docs**
   - Insert chosen reference path
   - Set conditioning strength
   - Add continuity notes

4. **Test Conditioning**
   - Generate test frame with reference
   - Verify style transfer working
   - Adjust strength if needed

---

## QUALITY GATES

### Reference Image Requirements:
- ✓ 1920×1080 resolution
- ✓ No text or logos visible
- ✓ Clear lighting direction
- ✓ Appropriate color palette
- ✓ No identifiable people
- ✓ Matches segment mood

### Rejection Criteria:
- ✗ Contains any text
- ✗ Shows real brands
- ✗ Wrong aspect ratio
- ✗ Poor image quality
- ✗ Conflicting style

---

**END OF STYLEBOARDS PLAN**