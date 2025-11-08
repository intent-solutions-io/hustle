# Lyria Orchestral Score Master - Variable Duration
**Version:** 2.0
**Updated:** 2025-11-07
**Purpose:** Master orchestral score specification with variable duration support

---

## DURATION CONFIGURATION

**Duration:** Follow docs/021-PP-PLAN-duration-profile.md for active profile. Obey segment boundaries from:
- Primary: docs/002-DD-CSVS-segments.csv-v2 (if present)
- Fallback: docs/002-DD-CSVS-segments.csv

The score shall scale dynamically to match the selected duration profile (SHORT/STANDARD/EXTENDED).

---

## LEITMOTIFS

### Core Motifs

1. **Innocence Motif** (Primary Theme)
   - Initial presentation: Segment 1 (G major, playful)
   - Dark reprise: Segment 7 (G minor, fractured)
   - Characteristics: Simple melody, childlike intervals, pizzicato strings

2. **Governance Motif** (Authority Theme)
   - Presentation: Segment 2
   - Characteristics: Low brass, institutional coldness, E minor modal

3. **Capital Motif** (Money Theme)
   - Development: Segments 3-5 (progressive intensification)
   - Characteristics: Mechanical repetition, dissonant piano clusters, sharp violin stabs

4. **Clinical Motif** (Medical Horror)
   - Presentation: Segment 6
   - Characteristics: Atonal, sustained dissonance, metallic percussion

5. **Question Motif** (Unresolved Theme)
   - Climax: Segment 8
   - Characteristics: Suspended harmony, unresolved cadence, instrumental climax

---

## MOVEMENT STRUCTURE

### Segment 1: THE INNOCENCE
- **Mood:** Joyful, playful, carefree
- **Key:** G major
- **Tempo:** Allegro (120-132 BPM)
- **Dynamics:** mf
- **Orchestration:** Pizzicato strings, flutes, harp, glockenspiel
- **Leitmotif:** Innocence motif (establish)

### Segment 2: THE COMMISSIONER
- **Mood:** Cold, institutional, disconnected
- **Key:** E minor
- **Tempo:** Andante (76-84 BPM)
- **Dynamics:** mf to f
- **Orchestration:** Low cellos, contrabass, bassoon
- **Leitmotif:** Governance motif (introduce)

### Segment 3: KANG - THE INVESTMENT
- **Mood:** Building tension, calculation
- **Key:** C minor modulating
- **Tempo:** Moderato (96-104 BPM)
- **Dynamics:** f
- **Orchestration:** Dissonant piano enters, strings building
- **Leitmotif:** Capital motif (introduce)

### Segment 4: LONG - THE STADIUM
- **Mood:** Mechanical, relentless
- **Key:** Atonal/chromatic
- **Tempo:** Moderato (96-104 BPM)
- **Dynamics:** f to ff
- **Orchestration:** Full strings, sharp violin stabs, timpani
- **Leitmotif:** Capital motif (develop)

### Segment 5: WILFS - THE MONEY
- **Mood:** Oppressive, overwhelming greed
- **Key:** Chromatic clusters
- **Tempo:** Moderato (96-104 BPM)
- **Dynamics:** ff
- **Orchestration:** Full orchestra, brass dominance
- **Leitmotif:** Capital motif (climax)

### Segment 6: THE POLICY
- **Mood:** Clinical terror, medical horror
- **Key:** Atonal
- **Tempo:** Adagio (60-66 BPM)
- **Dynamics:** ff with sudden drops to p
- **Orchestration:** Sustained strings, metallic percussion, prepared piano
- **Leitmotif:** Clinical motif (establish)

### Segment 7: THE CONFUSION
- **Mood:** Lost innocence, melancholic
- **Key:** G minor (dark mirror of Segment 1)
- **Tempo:** Andante (76-84 BPM)
- **Dynamics:** mf to mp fading
- **Orchestration:** Solo violin struggling, fragmented orchestra
- **Leitmotif:** Innocence motif (fractured reprise)

### Segment 8: THE UNANSWERED QUESTION
- **Mood:** Devastating emotional climax
- **Key:** Suspended/unresolved
- **Tempo:** Ritardando to Adagio
- **Dynamics:** mp building to fff, then pp whisper
- **Orchestration:** Full orchestra swelling to instrumental climax
- **Leitmotif:** Question motif (unresolved)

### Optional Coda (EXTENDED profile only)
- **Duration:** 10-15 seconds
- **Mood:** Hollow aftermath
- **Dynamics:** ppp
- **Content:** Distant echo of innocence motif, unresolved

---

## TECHNICAL SPECIFICATIONS

### Audio Format
- **Sample Rate:** 48000 Hz (48 kHz)
- **Bit Depth:** 24-bit
- **Channels:** Stereo (2.0)
- **Format:** WAV (uncompressed)

### Stem Outputs Required
1. **drums.wav** - All percussion and timpani
2. **bass.wav** - Contrabass, bass instruments
3. **harmony.wav** - Harmonic content (piano, harp, pads)
4. **melody.wav** - Lead melodic lines
5. **fx.wav** - Effects, prepared instruments, metallic sounds
6. **ambience.wav** - Optional abstract texture bed (room tone, wind, hum)

### Loudness Standards
- **Integrated Loudness:** -14 LUFS (±1 LU tolerance)
- **True Peak:** ≤ -1.0 dBTP
- **Loudness Range:** 7-12 LU
- **Short-term Max:** -10 LUFS

### Synchronization
- **Segment Boundaries:** Soft sync hits at each segment transition
- **Overlay Windows:** Duck 3dB during text overlay periods
- **Tail:** 250ms reverb tail beyond final boundary

---

## CONSTRAINTS

### Musical Constraints
- **mode:** instrumental_score_only
- **vocals:** false
- **spoken_voice:** false
- **narration:** false
- **dialogue_samples:** false
- **crowd_fx:** false
- **chant:** false
- **NO foley** - Music and orchestral sounds only
- **NO crowd sounds** - Pure orchestral
- **ambient_layer:** optional low-level texture bed only (wind, room tone, stadium air, clinical hum)
- **deliver only instrumental score** and optional abstract ambience bed

### Production Constraints
- Stems must sum to master mix exactly
- All files must include embedded BWF metadata
- Provide markers at segment boundaries
- Include tempo map for post-production sync

---

## STYLE REFERENCES

**Overall Style:** Cinematic orchestral score combining:
- Hans Zimmer (epic orchestral swells)
- Thomas Newman (emotional intimacy)
- Jóhann Jóhannsson (minimalist darkness)

**Specific References:**
- Segment 1: "American Beauty" opening innocence
- Segment 2-5: "The Social Network" institutional coldness
- Segment 6: "Chernobyl" clinical horror
- Segment 7: "Schindler's List" lost innocence
- Segment 8: "Arrival" unresolved question

---

## DELIVERY STRUCTURE

### File Organization
```
020-audio/
├── music/
│   ├── master_mix.wav
│   ├── master_no-coda.wav (if EXTENDED profile)
│   ├── stems/
│   │   ├── drums.wav
│   │   ├── bass.wav
│   │   ├── harmony.wav
│   │   ├── melody.wav
│   │   ├── fx.wav
│   │   └── vox.wav
│   └── audition/
│       └── master_preview.mp3
```

---

## QUALITY CONTROL

All delivered files must pass:
- LUFS analysis within target range
- True peak compliance
- Phase correlation > 0.3
- No digital clipping
- Stem null test against master

See docs/024-LS-STAT-audio-loudness-report.md for detailed QC metrics.

---

**END OF SPECIFICATION**