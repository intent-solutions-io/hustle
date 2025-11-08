# Veo 3.1 Negative Artifacts Reference
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Comprehensive avoid-list for VEO 3.1 generation

---

## CRITICAL AVOIDANCE LIST

### Text & Typography
- ❌ **NO on-frame text of any kind**
- ❌ **NO captions or subtitles**
- ❌ **NO title cards or credits**
- ❌ **NO readable documents or papers**
- ❌ **NO computer screens with text**
- ❌ **NO street signs with readable text**
- ❌ **NO name tags or badges**
- ❌ **NO scoreboard text or numbers**

### Logos & Branding
- ❌ **NO Nike swoosh or sports brand logos**
- ❌ **NO NWSL official logos or shields**
- ❌ **NO team logos or crests**
- ❌ **NO FIFA or US Soccer emblems**
- ❌ **NO corporate logos on buildings**
- ❌ **NO sponsored signage**
- ❌ **NO branded equipment**
- ❌ **NO recognizable uniforms with marks**

### Legal & Identity
- ❌ **NO identifiable faces of real people**
- ❌ **NO specific player jerseys with names**
- ❌ **NO actual stadium names visible**
- ❌ **NO real medical facility names**
- ❌ **NO actual corporate building identities**
- ❌ **NO government seals or emblems**
- ❌ **NO identifiable minors' faces**
- ❌ **NO license plates**

### Technical Artifacts
- ❌ **NO watermarks**
- ❌ **NO timestamp overlays**
- ❌ **NO camera UI elements**
- ❌ **NO broadcast graphics**
- ❌ **NO news channel bugs**
- ❌ **NO social media interface elements**
- ❌ **NO copyright notices**
- ❌ **NO "Getty Images" type marks**

---

## VISUAL DISTORTION AVOIDANCE

### Face & Body Issues
- ❌ **NO melting or distorted faces**
- ❌ **NO extra or missing fingers**
- ❌ **NO impossible body positions**
- ❌ **NO floating limbs**
- ❌ **NO merged bodies**
- ❌ **NO facial feature migration**
- ❌ **NO unnatural stretching**
- ❌ **NO body parts phasing through objects**

### Motion Artifacts
- ❌ **NO strobing or flicker**
- ❌ **NO frame interpolation artifacts**
- ❌ **NO morphing between unrelated objects**
- ❌ **NO impossible physics**
- ❌ **NO sliding while walking**
- ❌ **NO jittery camera movements**
- ❌ **NO speed ramping glitches**
- ❌ **NO temporal inconsistencies**

### Lighting Problems
- ❌ **NO multiple shadow directions**
- ❌ **NO impossible light sources**
- ❌ **NO sudden exposure jumps**
- ❌ **NO auto-gain pumping**
- ❌ **NO unnatural color shifts**
- ❌ **NO black or white clipping**
- ❌ **NO banding in gradients**
- ❌ **NO HDR tone mapping errors**

---

## CONTENT RESTRICTIONS

### Inappropriate Elements
- ❌ **NO violence or aggressive contact**
- ❌ **NO medical procedures shown**
- ❌ **NO injection or surgical imagery**
- ❌ **NO inappropriate gestures**
- ❌ **NO wardrobe malfunctions**
- ❌ **NO revealing clothing issues**
- ❌ **NO suggestive positioning**

### Factual Misrepresentation
- ❌ **NO wrong sport equipment (basketball in soccer)**
- ❌ **NO wrong venue types**
- ❌ **NO anachronistic elements**
- ❌ **NO wrong uniforms for context**
- ❌ **NO impossible architectural features**
- ❌ **NO wrong medical equipment**
- ❌ **NO fictional technology**

### Environmental Issues
- ❌ **NO floating objects**
- ❌ **NO M.C. Escher-like geometry**
- ❌ **NO texture mapping errors**
- ❌ **NO repeating pattern glitches**
- ❌ **NO depth perception failures**
- ❌ **NO perspective distortions**
- ❌ **NO missing shadows**
- ❌ **NO reflection errors**

---

## PROMPT MODIFIERS TO AVOID ARTIFACTS

### Always Include:
```
"photorealistic"
"natural proportions"
"anatomically correct"
"physically plausible"
"consistent lighting"
"stable camera motion"
"no text or logos"
"generic signage only"
```

### For Face Issues Add:
```
"natural facial features"
"proper facial proportions"
"faces at distance or naturally obscured"
"no facial distortions"
```

### For Motion Issues Add:
```
"smooth camera movement"
"gimbal stabilized"
"constant frame rate"
"no speed ramping"
"locked exposure"
```

### For Content Issues Add:
```
"appropriate for all audiences"
"documentary style"
"professional sports context"
"generic uniforms and venues"
```

---

## QUALITY GATES

### Automatic Rejection Criteria
1. Any readable text visible
2. Any identifiable logo or brand
3. Face or hand severe distortion
4. Frame rate not 24fps
5. Resolution not 1920×1080
6. Duration off by >1 second
7. Corrupted frames
8. Black frames >0.5 seconds

### Manual Review Required
1. Minor motion blur
2. Slight color shift
3. Minor continuity break
4. Acceptable generic signage
5. Distant crowd faces
6. Minor shadow issues
7. Slight grain variation

---

## SEVERITY LEVELS

### CRITICAL (Immediate Re-roll)
- Text or logos visible
- Wrong technical specs
- Severe distortions
- Inappropriate content

### HIGH (Re-roll Recommended)
- Continuity breaks
- Lighting inconsistencies
- Motion artifacts
- Face quality issues

### MEDIUM (Consider Re-roll)
- Minor color shifts
- Slight motion blur
- Shadow problems
- Background issues

### LOW (Acceptable)
- Minor grain variation
- Slight exposure differences
- Minimal motion blur
- Distant detail loss

---

## RE-GENERATION STRATEGY

### First Attempt Failed:
1. Add more specific constraints
2. Tighten technical parameters
3. Simplify scene complexity
4. Add negative prompts explicitly

### Second Attempt Failed:
1. Change camera angle/distance
2. Adjust motion type
3. Modify lighting setup
4. Reduce subject count

### Third Attempt Failed:
1. Simplify to static shot
2. Use different scene approach
3. Consider alternate segment concept
4. Escalate for manual intervention

---

**END OF NEGATIVE ARTIFACTS REFERENCE**