# Render Report & Quality Control
**Version:** 1.0
**Date:** 2025-11-07
**Project:** Why Won't They Answer?
**Status:** Pre-Render QC Checklist

---

## RENDER STATUS

### Current Phase
- **Phase:** 5 - Assembly, Overlays, Grade, Mix, Deliver
- **Status:** Infrastructure Ready
- **Blocking:** Awaiting video segments and audio score

### Files Prepared
| Component | Status | Location |
|-----------|--------|----------|
| Overlay Specifications | ✅ Complete | docs/6767-DR-TMPL-overlay-style.md |
| Overlay Map | ✅ Complete | docs/036-DD-DATA-overlay-map.csv |
| ASS Subtitles | ✅ Complete | 040-overlays/why_overlays.ass |
| SRT Subtitles | ✅ Complete | 040-overlays/why_overlays.srt |
| FFmpeg Pipeline | ✅ Complete | 050-scripts/ffmpeg_overlay_pipeline.sh |
| Export Specifications | ✅ Complete | docs/037-OD-SPEC-export-specifications.md |

---

## PRE-RENDER CHECKLIST

### Source Files Required
- [ ] SEG-01_best.mp4 (8.02s) - Innocence scene
- [ ] SEG-02_best.mp4 (7.98s) - Commissioner office
- [ ] SEG-03_best.mp4 (8.01s) - Kang investment
- [ ] SEG-04_best.mp4 (8.00s) - Long stadium
- [ ] SEG-05_best.mp4 (8.03s) - Wilf boardroom
- [ ] SEG-06_best.mp4 (7.99s) - Medical policy
- [ ] SEG-07_best.mp4 (8.00s) - Confusion return
- [ ] SEG-08_best.mp4 (4.01s) - Final question
- [ ] master_mix.wav - Lyria orchestral score (60.04s)

### Technical Verification
- [ ] All segments at 1920×1080 resolution
- [ ] All segments at 24fps constant frame rate
- [ ] Total duration equals 60.04s (±0.5s)
- [ ] Audio at -14 LUFS (±1)
- [ ] No logos or text in raw video
- [ ] No human voices in audio track

---

## CRITICAL QC POINTS

### Dollar Amount Verification
**MUST VERIFY BEFORE RELEASE:**
1. **$30 million** (SEG-03, 0:20-0:21)
   - [ ] Displays as "$30 million+" not "0 million+"
   - [ ] Properly escaped in script: `\$30`

2. **$117 million** (SEG-04, 0:28-0:29)
   - [ ] Displays as "$117 million" not "17 million"
   - [ ] Properly escaped in script: `\$117`

### Policy Text Accuracy
**EXACT WORDING REQUIRED:**
- [ ] "NWSL Policy on Transgender Athletes (2021)."
- [ ] "declare female identity and keep serum testosterone <10 nmol/L for ≥12 months"
- [ ] "Suppression can be via medication or surgical castration."

### Voice-Free Verification
**NO HUMAN VOICE ALLOWED:**
- [ ] Veo segments: audio tracks removed/muted
- [ ] Lyria score: instrumental only (no vocals)
- [ ] Final mix: orchestral music only
- [ ] No narration, dialogue, or spoken word

---

## RENDER PIPELINE STAGES

### Stage 1: Video Assembly
```bash
# Status: [ ] Not Started [ ] In Progress [ ] Complete
ffmpeg -f concat -safe 0 -i docs/029-DD-CSVS-concat-list.txt \
  -c copy 030-video/assembly/video_only.mp4
```
- [ ] Duration check: 60.04s
- [ ] No dropped frames
- [ ] Transitions clean

### Stage 2: Audio Integration
```bash
# Status: [ ] Not Started [ ] In Progress [ ] Complete
ffmpeg -i 030-video/assembly/video_only.mp4 \
  -i 020-audio/music/master_mix.wav \
  -c:v copy -c:a aac -b:a 256k \
  -map 0:v -map 1:a \
  030-video/assembly/video_with_music.mp4
```
- [ ] Audio sync verified
- [ ] Music levels balanced
- [ ] No clipping detected

### Stage 3: Text Overlays
```bash
# Status: [ ] Not Started [ ] In Progress [ ] Complete
./050-scripts/ffmpeg_overlay_pipeline.sh \
  030-video/assembly/video_with_music.mp4 \
  060-renders/final/why_wont_they_answer_master.mp4
```
- [ ] All overlays visible
- [ ] Dollar amounts correct
- [ ] Watermark at 40% opacity

### Stage 4: Final Export
```bash
# Status: [ ] Not Started [ ] In Progress [ ] Complete
# See docs/037-OD-SPEC-export-specifications.md
```
- [ ] Master at CRF 18
- [ ] Social versions created
- [ ] Archive ProRes generated

---

## POST-RENDER VERIFICATION

### Visual Quality
- [ ] No compression artifacts
- [ ] Colors consistent across segments
- [ ] Text fully readable
- [ ] No black frames
- [ ] No frozen frames

### Audio Quality
- [ ] -14 LUFS achieved
- [ ] True peak ≤ -1.0 dBTP
- [ ] No distortion
- [ ] Music emotional arc correct
- [ ] Silence at end (unresolved)

### Content Verification
- [ ] All 18 text overlays present
- [ ] Timing matches specification
- [ ] @asphaltcowb0y watermark visible
- [ ] No unintended elements

---

## RENDER METRICS

### File Sizes (Expected)
| Version | Resolution | Expected Size |
|---------|------------|---------------|
| Master | 1920×1080 | ~150-200MB |
| Vertical | 1080×1920 | ~60MB |
| Square | 1080×1080 | ~45MB |
| Twitter | 1920×1080 | <100MB |
| ProRes | 1920×1080 | ~1.5GB |

### Processing Times (Estimated)
| Process | Duration |
|---------|----------|
| Video Assembly | 30 seconds |
| Audio Mix | 1 minute |
| Text Overlays | 3 minutes |
| Master Export | 5 minutes |
| All Social Versions | 10 minutes |
| **Total Pipeline** | ~20 minutes |

---

## ERROR LOG

### Issues Encountered
| Time | Issue | Resolution |
|------|-------|------------|
| - | - | - |

### Warnings
| Component | Warning | Action |
|-----------|---------|--------|
| - | - | - |

---

## FINAL QC SIGNOFF

### Technical Compliance
- [ ] Duration: 60.0s ±0.5s
- [ ] Resolution: 1920×1080
- [ ] Frame Rate: 24fps
- [ ] Audio: -14 LUFS
- [ ] File formats correct

### Content Compliance
- [ ] Dollar amounts display correctly
- [ ] Policy text accurate
- [ ] No human voices
- [ ] Watermark present
- [ ] All overlays readable

### Delivery Readiness
- [ ] Master file complete
- [ ] Social versions exported
- [ ] Archive created
- [ ] Checksums generated
- [ ] Documentation complete

---

## APPROVAL

### Quality Control
- **QC Performed By:** [Pending]
- **QC Date:** [Pending]
- **QC Status:** ⏳ Awaiting Render

### Final Approval
- **Approved By:** [Pending]
- **Approval Date:** [Pending]
- **Release Status:** ⏳ Pre-Production

---

## NOTES

### Critical Reminders
1. **ALWAYS ESCAPE DOLLAR SIGNS** in FFmpeg commands
2. **NO HUMAN VOICES** anywhere in production
3. **VERIFY POLICY TEXT** matches exactly
4. **CHECK WATERMARK OPACITY** at 40%

### Next Steps
1. Generate video segments with Veo
2. Generate orchestral score with Lyria
3. Execute render pipeline
4. Perform full QC
5. Generate delivery package

---

**Report Generated:** 2025-11-07
**Pipeline Status:** Ready (awaiting source files)
**Estimated Completion:** Upon source availability

**END OF RENDER REPORT**