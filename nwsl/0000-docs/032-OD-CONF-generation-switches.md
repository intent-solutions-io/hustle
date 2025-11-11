# Generation Switches Configuration
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Global switches for Veo and Lyria generation control

---

## VEO GENERATION SWITCHES

### Conditioning
- **conditioning.enabled:** true
- **conditioning.referenceImage:** [path to style frame from Imagen]
- **conditioning.referenceStrength:** 0.65

### Aspect Ratio
- **aspect.primary:** "16:9"
- **aspect.socialCuts:** ["9:16", "1:1"]

### Audio Control
- **audio.generateAnyAudio:** false
  - No dialogue generation
  - No foley generation
  - No crowd sounds
  - No ambient audio from Veo
  - All audio comes from post-production

### Reproducibility
- **repro.seedHint:** [string or empty]

---

## LYRIA GENERATION SWITCHES

### Mode
- **mode:** instrumental_score_only
- **vocals:** false
- **spoken_voice:** false
- **narration:** false
- **dialogue_samples:** false

### Ambient Layer
- **ambient_layer:** optional low-level texture bed only
  - Allowed: wind, room tone, stadium air, clinical hum
  - Forbidden: intelligible speech, crowd chants, announcements

### Technical Specifications
- **integrated_loudness_target:** -14 LUFS
- **true_peak_ceiling_dBTP:** -1.0
- **sample_rate:** 48000 Hz
- **bit_depth:** 24-bit

### Deliverables
- **primary:** master mix WAV (instrumental score only)
- **secondary:** optional ambient bed WAV (abstract textures)
- **stems_or_passes:**
  - If GA Lyria cannot export stems: create separate passes
  - Pass 1: score-only
  - Pass 2: ambience-only (if applicable)
  - Treat as pseudo-stems in post

---

## OVERLAY TEXT POLICY

### Implementation
- **method:** in-post only
- **burned_in:** never in Veo renders
- **timing:** per approved cue sheet

### Content Requirements
- Must match approved truth language exactly:
  - Segment 2: Governance lines
  - Segment 3: Women's soccer investment ("$30 million+")
  - Segment 6: Policy wording including "surgical castration"

---

## AUDIO PHILOSOPHY

### Core Principle
**NO HUMAN VOICE ANYWHERE IN THE PRODUCTION**

### Sound Design Elements
1. **Instrumental Score** (Lyria)
   - Orchestral leitmotifs
   - Emotional arc support
   - Dynamic range control

2. **Abstract Ambience** (Optional)
   - Environmental textures
   - Non-literal atmosphere
   - Subliminal tension support

3. **Silence**
   - Intentional absence of voice
   - Part of the emotional impact
   - Creates space for reflection

### Forbidden Audio Elements
- ❌ Narration
- ❌ Voice-over
- ❌ Dialogue
- ❌ Interview audio
- ❌ Crowd chants
- ❌ Stadium announcements
- ❌ News broadcasts
- ❌ Spoken commentary
- ❌ Whispers or vocalizations
- ❌ Soprano or any vocal performance

---

## IMPLEMENTATION NOTES

### For Veo Prompts
Always include in every segment:
```
Audio:
  generateAnyAudio: false
```

### For Lyria Prompts
Always specify:
```
mode: instrumental_score_only
vocals: false
spoken_voice: false
```

### For Post-Production
- Text overlays added in editing software
- Score mixed at -14 LUFS
- Optional ambient bed mixed -20dB below score
- No dialogue track in timeline

---

## QUALITY GATES

### Automatic Rejection
- Any human voice detected in Veo output
- Any vocals in Lyria render
- Any dialogue or narration in stems

### Verification Steps
1. Scan all audio for voice frequencies (300-3000Hz peaks)
2. Manual review for any vocal artifacts
3. Confirm instrumental-only delivery

---

**END OF GENERATION SWITCHES**