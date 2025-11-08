# Duration Profiles for "Why Won't They Answer?"
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Variable duration specifications for orchestral score

---

## ACTIVE PROFILE

**Current Selection:** SHORT (60 seconds)

*Note: If docs/002-DD-CSVS-segments.csv-v2 exists, it overrides these profiles.*

---

## PROFILE: SHORT (Original)

**Total Duration:** 60 seconds
**Use Case:** Social media, quick impact, TikTok/Instagram Reels

| Segment | Title | Start | End | Duration |
|---------|-------|-------|-----|----------|
| 1 | The Innocence | 0s | 8s | 8s |
| 2 | The Commissioner | 8s | 16s | 8s |
| 3 | Kang - Investment | 16s | 24s | 8s |
| 4 | Long - Stadium | 24s | 32s | 8s |
| 5 | Wilfs - Money | 32s | 40s | 8s |
| 6 | Policy - Medical | 40s | 48s | 8s |
| 7 | The Confusion | 48s | 56s | 8s |
| 8 | Unanswered Question | 56s | 60s | 4s |

**Music Notes:**
- Rapid emotional progression
- Compressed dynamics
- Quick motif statements
- Immediate impact

---

## PROFILE: STANDARD (Extended)

**Total Duration:** 116 seconds (~2 minutes)
**Use Case:** YouTube, standard documentary format

| Segment | Title | Start | End | Duration |
|---------|-------|-------|-----|----------|
| 1 | The Innocence | 0s | 16s | 16s |
| 2 | The Commissioner | 16s | 32s | 16s |
| 3 | Kang - Investment | 32s | 48s | 16s |
| 4 | Long - Stadium | 48s | 64s | 16s |
| 5 | Wilfs - Money | 64s | 80s | 16s |
| 6 | Policy - Medical | 80s | 96s | 16s |
| 7 | The Confusion | 96s | 112s | 16s |
| 8 | Unanswered Question | 112s | 116s | 4s |

**Music Notes:**
- Natural breathing room for themes
- Full development of leitmotifs
- Proper dynamic range
- Emotional build has time to resonate

---

## PROFILE: EXTENDED (Cinematic)

**Total Duration:** 150 seconds (2.5 minutes)
**Use Case:** Film festivals, full documentary, presentations

| Segment | Title | Start | End | Duration |
|---------|-------|-------|-----|----------|
| 1 | The Innocence | 0s | 20s | 20s |
| 2 | The Commissioner | 20s | 38s | 18s |
| 3 | Kang - Investment | 38s | 56s | 18s |
| 4 | Long - Stadium | 56s | 74s | 18s |
| 5 | Wilfs - Money | 74s | 92s | 18s |
| 6 | Policy - Medical | 92s | 112s | 20s |
| 7 | The Confusion | 112s | 130s | 18s |
| 8 | Unanswered Question | 130s | 135s | 5s |
| CODA | Aftermath | 135s | 150s | 15s |

**Music Notes:**
- Full orchestral development
- Complex harmonic progressions
- Extended coda for reflection
- Cinema-quality pacing
- Allows for rubato and expression

---

## CODA SPECIFICATION (EXTENDED only)

**Duration:** 15 seconds (135-150s)
**Purpose:** Emotional aftermath and unresolved tension

### Musical Content:
- Distant echo of innocence motif (ppp dynamics)
- Unresolved suspended harmony
- Solo instruments dropping out one by one
- Final held note: Low C pedal with unresolved major 7th
- Fade to silence over final 3 seconds

### Emotional Intent:
- Leave audience in contemplation
- No resolution or closure
- Haunting aftermath
- Questions linger

---

## TIMING FLEXIBILITY

### Rubato Allowance:
- ±2% per segment for musical expression
- Ritardando into Segment 8 (up to 10% slower)
- Accelerando permitted in Segments 3-5 buildup

### Sync Points (Hard Locks):
- Start of each segment (±100ms)
- Text overlay entry points (exact)
- Final frame (exact)

---

## SELECTION CRITERIA

### Choose SHORT when:
- Platform limitations (60s max)
- High-impact social media
- Viewer attention span concerns
- Quick message delivery needed

### Choose STANDARD when:
- YouTube/Vimeo primary platform
- Full emotional arc desired
- Educational context
- Standard documentary format

### Choose EXTENDED when:
- Festival submission
- Theatrical presentation
- Maximum emotional impact
- Artistic expression priority

---

## IMPLEMENTATION NOTES

1. **Version Control:** If creating v2, save as `002-DD-CSVS-segments.csv-v2`
2. **Score Scaling:** Lyria must adapt to selected profile automatically
3. **Stem Alignment:** All stems must match selected duration exactly
4. **Coda Rendering:** Separate bounce of no-coda version for EXTENDED

---

**END OF DURATION PROFILES**