# Assembly Plan
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Final assembly specifications for "Why Won't They Answer?"

---

## ACTIVE DURATION PROFILE

**Selected:** SHORT (60 seconds)
**Total Runtime:** 60.04 seconds (within tolerance)

| Segment | Start | End | Duration |
|---------|-------|-----|----------|
| SEG-01 | 00:00.00 | 00:08.02 | 8.02s |
| SEG-02 | 00:08.02 | 00:16.00 | 7.98s |
| SEG-03 | 00:16.00 | 00:24.01 | 8.01s |
| SEG-04 | 00:24.01 | 00:32.01 | 8.00s |
| SEG-05 | 00:32.01 | 00:40.04 | 8.03s |
| SEG-06 | 00:40.04 | 00:48.03 | 7.99s |
| SEG-07 | 00:48.03 | 00:56.03 | 8.00s |
| SEG-08 | 00:56.03 | 01:00.04 | 4.01s |

---

## TRANSITION POLICY

### Standard Transitions
- **Type:** Hard cuts (no dissolves)
- **Exception:** SEG-05 → SEG-06 (0.5s dissolve)
- **Rationale:** Hard cuts maintain urgency and impact

### Transition Matrix
| From | To | Type | Duration | Notes |
|------|----|------|----------|-------|
| SEG-01 | SEG-02 | Hard cut | 0ms | Joy to institutional cold |
| SEG-02 | SEG-03 | Hard cut | 0ms | Commissioner to investment |
| SEG-03 | SEG-04 | Hard cut | 0ms | Money to stadium |
| SEG-04 | SEG-05 | Hard cut | 0ms | Stadium to boardroom |
| SEG-05 | SEG-06 | **Dissolve** | 500ms | Peak greed to medical horror |
| SEG-06 | SEG-07 | Hard cut | 0ms | Clinical to confusion |
| SEG-07 | SEG-08 | Hard cut | 0ms | Confusion to confrontation |

---

## MUSIC SYNCHRONIZATION

### Cue Sheet Integration
Reference: `docs/023-DR-REFF-lyria-cue-sheet.md`

| Segment | Musical Cue | Hit Point | Sync Action |
|---------|-------------|-----------|-------------|
| SEG-01 | Innocence motif | 0:00 | Soft entry on first frame |
| SEG-02 | Governance motif | 0:08 | Hard hit on cut |
| SEG-03 | Capital motif intro | 0:16 | Piano cluster on cut |
| SEG-04 | Capital develop | 0:24 | Violin stab on cut |
| SEG-05 | Capital climax | 0:32 | Full orchestra blast |
| SEG-06 | Clinical motif | 0:40 | Sudden drop to p |
| SEG-07 | Innocence reprise | 0:48 | Soft return G minor |
| SEG-08 | Question motif | 0:56 | Build to fff |
| END | Unresolved | 1:00 | Cut to silence |

### Audio Ducking Windows
Per cue sheet, implement -3dB ducking at 200Hz-4kHz during text overlays:
- Attack: 100ms
- Release: 200ms
- Total windows: 18

---

## TEXT OVERLAY TIMING

### Overlay Implementation
**Method:** Post-production overlay (NOT burned into Veo renders)
**Font:** Helvetica Neue Bold
**Color:** White with black outline
**Position:** Lower third safe zone

### Per-Segment Overlays

#### SEG-01: The Innocence (0:00-0:08)
- No text overlays

#### SEG-02: The Commissioner (0:08-0:16)
- **0:10-0:11:** "Jessica Berman — NWSL Commissioner (since 2022)."
- **0:13-0:14:** "The league's Board of Governors (club ownership representatives) controls major decisions."

#### SEG-03: Kang - Investment (0:16-0:24)
- **0:17-0:18:** "Michele Kang - Washington Spirit"
- **0:20-0:21:** "Spent \$30 million+ on women's soccer"
- **0:22-0:22.5:** "Why no answer?"

#### SEG-04: Long - Stadium (0:24-0:32)
- **0:25-0:26:** "Angie Long - Kansas City Current"
- **0:28-0:29:** "Built a \$117 million stadium..."
- **0:30-0:31:** "...only to let males play"

#### SEG-05: Wilfs - Money (0:32-0:40)
- **0:33-0:34:** "The Wilf Family - Orlando Pride"
- **0:35-0:36:** "What excuse will they use?"
- **0:37-0:38:** "Money, probably."

#### SEG-06: Policy - Medical (0:40-0:48)
- **0:41-0:42:** "NWSL Policy on Transgender Athletes (2021)."
- **0:44-0:46:** "Eligibility for transgender women: declare female identity and keep serum testosterone <10 nmol/L for ≥12 months; compliance is tested."
- **0:46.5-0:47.5:** "Suppression can be via medication or surgical castration."

#### SEG-07: Confusion (0:48-0:56)
- **0:49-0:50:** "Thousands of young girls..."
- **0:51-0:52:** "Is it all about the money?"
- **0:54-0:55:** "What happened to women..."

#### SEG-08: Question (0:56-1:00)
- **0:57-0:58:** "Why won't you answer them?"

### Watermark
- **Text:** @asphaltcowb0y
- **Position:** Bottom right
- **Opacity:** 40%
- **Duration:** Full video

---

## ASSEMBLY WORKFLOW

### Step 1: Video Assembly
```bash
# Concatenate segments
ffmpeg -f concat -safe 0 -i docs/029-DD-CSVS-concat-list.txt \
    -c copy 030-video/assembly/video_only.mp4

# Verify duration
ffprobe -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 \
    030-video/assembly/video_only.mp4
```

### Step 2: Audio Integration
```bash
# Add Lyria master score
ffmpeg -i 030-video/assembly/video_only.mp4 \
    -i 020-audio/music/master_mix.wav \
    -c:v copy -c:a aac -b:a 256k \
    -map 0:v -map 1:a \
    030-video/assembly/video_with_music.mp4
```

### Step 3: Text Overlays
```bash
# Apply text overlays with proper escaping
# See scripts/ffmpeg_overlay_pipeline.sh for full command
# CRITICAL: Use \$ for dollar amounts!
```

### Step 4: Final Export
```bash
# Master delivery
ffmpeg -i 030-video/assembly/final_with_overlays.mp4 \
    -c:v libx264 -preset slow -crf 18 \
    -c:a aac -b:a 320k \
    -movflags +faststart \
    060-renders/final/why_wont_they_answer_master.mp4

# Social cuts (if needed)
# 9:16 vertical
# 1:1 square
```

---

## QUALITY CONTROL CHECKLIST

### Pre-Assembly
- [x] All segments at 1920×1080
- [x] All segments at 24fps
- [x] Total duration ~60 seconds
- [x] No logos or text in video
- [x] Audio tracks removed from video

### During Assembly
- [ ] Transitions smooth
- [ ] Music sync points hit
- [ ] Text overlays readable
- [ ] Dollar amounts escaped (\$)
- [ ] No audio clipping

### Post-Assembly
- [ ] Final duration: 60.0s ±0.5s
- [ ] Audio: -14 LUFS ±1
- [ ] True peak: ≤ -1.0 dBTP
- [ ] Text overlays verified
- [ ] Watermark visible

---

## DELIVERABLES

### Primary
1. **Master:** 060-renders/final/why_wont_they_answer_master.mp4
   - 1920×1080, 24fps, H.264
   - Audio: AAC 320kbps
   - Duration: 60 seconds

### Alternate Versions
2. **No Music:** For review/approval
3. **No Overlays:** Clean version
4. **Social 9:16:** Vertical for TikTok/Reels
5. **Social 1:1:** Square for Instagram

### Archive Package
```
060-renders/archive/
├── project_files/
├── all_takes/
├── stems/
└── documentation/
```

---

## RISK MITIGATION

| Risk | Mitigation | Status |
|------|-----------|---------|
| Text overlay timing off | Preview with proxies first | Ready |
| Music sync drift | Lock to frame boundaries | Specified |
| Dollar sign bug | Escape all $ as \$ | Documented |
| Duration creep | Monitor after each step | Tracking |

---

## APPROVAL GATES

1. **Rough Assembly:** Video only for timing check
2. **Music Integration:** Verify sync and levels
3. **Text Review:** Confirm all overlays accurate
4. **Final QC:** Complete technical check

---

**Assembly Plan Complete**
**Ready for:** Phase 5 - Final Assembly
**Dependencies:** All video segments and Lyria score

---

**Plan Generated:** 2025-11-07
**Est. Assembly Time:** 2-3 hours
**Output Formats:** 5 versions

**END OF ASSEMBLY PLAN**