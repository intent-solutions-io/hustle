# Veo 3.1 Canonical Template
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Master template for VEO 3.1 video generation prompts

---

## CORE GENERATION PARAMETERS

### Technical Specifications
- **Resolution:** 1920×1080 (Full HD)
- **Frame Rate:** 24 fps constant
- **Codec:** H.264/MP4
- **Bitrate:** High quality (20+ Mbps)
- **Color Space:** Rec.709
- **Aspect Ratio:** 16:9

### Visual Style
- **Look:** Photorealistic documentary
- **Grain:** 3% film grain for authenticity
- **Contrast:** Filmic roll-off with soft contrast
- **Motion:** Controlled, stabilized movements
- **Depth of Field:** Natural bokeh for subject isolation

---

## PROMPT STRUCTURE

### Required Elements
```
[SCENE TYPE]: [Indoor/Outdoor/Mixed]
[DURATION]: [X seconds at 24fps]
[LENS]: [24mm/35mm/50mm/85mm as specified]
[MOTION]: [Static/Push-in/Pull-out/Pan/Tracking]
[LIGHTING]: [Golden hour/Office fluorescent/Medical clinical]
[SUBJECTS]: [Detailed description avoiding real identities]
[ACTION]: [Specific movements and timing]
[CONTINUITY]: [Match previous segment requirements]
```

### Safety Requirements
- NO real logos, badges, or seals
- NO identifiable trademarks or brands
- NO readable legal text or documents
- NO identifiable minors (blur/anonymize faces)
- NO on-frame text or captions
- NO watermarks or overlays

---

## SEGMENT-SPECIFIC GUIDANCE

### Segment 1: The Innocence (0-8s)
- Golden hour lighting
- Soft, warm tones
- Joyful children playing (faces anonymized)
- 35mm lens for intimacy
- Gentle camera movements

### Segment 2: The Commissioner (8-16s)
- Corporate office environment
- Cool fluorescent lighting (4300-4800K)
- 50mm lens for professional distance
- Subtle push-ins on subjects

### Segment 3-5: Investment/Stadium/Money (16-40s)
- Mix of architectural and financial imagery
- 24mm for wide stadium shots
- Increasing visual intensity
- Mechanical camera movements

### Segment 6: Policy/Medical (40-48s)
- Clinical environment
- Cold, sterile lighting (4200K with green tint)
- Static or slow movements
- Unsettling framing

### Segment 7: The Confusion (48-56s)
- Return to playground but darker
- Lost/confused children (anonymized)
- Fragmented editing approach
- Handheld movement (stabilized)

### Segment 8: Unanswered Question (56-60s)
- Close-up emotional shots
- 85mm lens for compression
- Slow motion elements
- Unresolved visual tension

---

## CONTINUITY REQUIREMENTS

### Maintain Across All Segments
1. **Color Science:** Consistent LUT application
2. **Exposure:** Skin tones at 55-65 IRE
3. **White Balance:** Per segment specifications
4. **Motion Speed:** 0.5-1.0 m/s for camera moves
5. **Frame Rate:** Locked at 24fps (no interpolation)

### Transitions
- Match action between segments where possible
- Maintain screen direction
- Consider eyeline matches
- Preserve motion vectors

---

## QUALITY CONTROL CHECKLIST

### Pre-Generation
- [ ] Segment duration specified
- [ ] Lens selection confirmed
- [ ] Motion type defined
- [ ] Lighting parameters set
- [ ] Safety requirements reviewed

### Post-Generation
- [ ] Resolution verified (1920×1080)
- [ ] Frame rate confirmed (24fps)
- [ ] Duration accurate (±0.04s tolerance)
- [ ] No unwanted text/logos visible
- [ ] Continuity maintained
- [ ] Color/exposure consistent

---

## RE-ROLL TRIGGERS

### When to regenerate:
1. **Technical Issues**
   - Wrong resolution or frame rate
   - Duration off by >0.04 seconds
   - Corrupted frames or artifacts

2. **Visual Problems**
   - Unwanted text or logos visible
   - Face/hand distortions
   - Flickering or banding
   - Motion blur excessive

3. **Continuity Breaks**
   - Color shift from previous segment
   - Mismatched lighting
   - Screen direction violation
   - Jarring style change

### Re-roll Solutions:
- Tighten lens focal length for distortion
- Add "gimbal stabilized" for shake
- Specify "no auto-gain" for flicker
- Include "generic signage only" for logos
- Add "natural limb articulation" for body issues

---

## EXAMPLE PROMPT FORMAT

```
Generate an 8-second photorealistic video at 1920×1080, 24fps:

SCENE: Children's soccer field at golden hour
LENS: 35mm with shallow depth of field
MOTION: Slow push-in from wide to medium shot
SUBJECTS: Young girls (6-10 years, faces naturally obscured or at distance) playing soccer with joy and innocence
LIGHTING: Warm golden hour, backlit with lens flares
ACTION: Children running, laughing, kicking soccer ball
STYLE: Documentary realism with 3% film grain
AVOID: Any logos, text, identifiable faces, brand names

Duration: exactly 8.00 seconds
Frame rate: locked at 24fps
Output: High-quality MP4
```

---

## CONDITIONING AND ASPECT CONTROL

### Conditioning
```
referenceImage: <relative-path-to-style-frame.png>   # REQUIRED when available
referenceStrength: 0.65
```

### Aspect
```
aspectRatio: "16:9"          # master deliverable
socialCuts:
  - "9:16"
  - "1:1"
```

### Audio
```
generateAnyAudio: false      # no dialogue, no narration, no foley
```

### Repro
```
seedHint: ""                 # fill if you want deterministic reruns
```

### NotesForPost
```
overlaysWillBeAddedInEdit: true
scoreWillBeAddedInEdit: true
noTextInFrame: true
noLogosNoBrands: true
```

---

**END OF CANONICAL TEMPLATE**