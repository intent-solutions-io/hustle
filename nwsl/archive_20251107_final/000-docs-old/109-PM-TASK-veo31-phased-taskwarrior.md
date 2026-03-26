# VEO 3.1 PROJECT - PHASED TASKWARRIOR IMPLEMENTATION
**Created:** 2025-11-07
**Project:** NWSL Documentary - "Why Won't They Answer?"
**Duration:** 60 seconds (8 segments)
**Status:** Ready for phased execution

---

## PROJECT OVERVIEW

**Objective:** Create a 60-second documentary exposing NWSL transgender policy
**Structure:** 8 video segments + orchestral score + text overlays
**Format:** Individual Veo clips assembled with Lyria score in post-production

---

## TASKWARRIOR PROJECT SETUP

```bash
# Create project
task project:veo31 add "VEO 3.1 Documentary Master Project" priority:H due:2days +documentary +nwsl

# Set urgency weights for this project
task config urgency.user.project.veo31.coefficient 10.0
task config urgency.user.tag.video.coefficient 8.0
task config urgency.user.tag.critical.coefficient 12.0
```

---

## PHASE 1: VIDEO GENERATION (SEGMENTS)

### Phase 1A: Priority Segments (Critical Path)

```bash
# Task 1: Segment 1 - The Innocence
task add "Generate Segment 1: Young girls playing soccer (8s)" \
  project:veo31 priority:H due:today \
  +video +segment +critical \
  annotate "Golden hour, slow motion, ESPN documentary style"

# Task 2: Segment 8 - Final Face
task add "Generate Segment 8: Teenage athlete close-up (4s)" \
  project:veo31 priority:H due:today \
  +video +segment +critical \
  annotate "Extreme close-up, single tear, devastating emotion"

# Task 3: Lyria Score
task add "Generate Lyria orchestral score (60s)" \
  project:veo31 priority:H due:today \
  +audio +music +critical \
  annotate "8 movements, Hans Zimmer style, soprano finale"
```

### Phase 1B: Emotional Segments (Second Priority)

```bash
# Task 4: Segment 7 - The Confusion
task add "Generate Segment 7: Confused children at dusk (8s)" \
  project:veo31 priority:M due:tomorrow depends:1 \
  +video +segment +emotional \
  annotate "Twilight, emotional close-ups, innocence confronting reality"

# Task 5: Segment 6 - Medical Reality
task add "Generate Segment 6: Clinical medical environment (8s)" \
  project:veo31 priority:M due:tomorrow depends:1 \
  +video +segment +controversial \
  annotate "Testosterone blockers, harsh fluorescent, clinical horror"
```

### Phase 1C: Corporate/Money Segments (Third Priority)

```bash
# Task 6: Segment 2 - Commissioner
task add "Generate Segment 2: Empty corporate office (8s)" \
  project:veo31 priority:L due:2days depends:4 \
  +video +segment +corporate \
  annotate "Cold institutional power, empty chair, city skyline"

# Task 7: Segment 3 - Michele Kang
task add "Generate Segment 3: $30 million investment (8s)" \
  project:veo31 priority:L due:2days depends:4 \
  +video +segment +money \
  annotate "CRITICAL: Must show $30 million, not $0"

# Task 8: Segment 4 - Angie Long
task add "Generate Segment 4: $117 million stadium (8s)" \
  project:veo31 priority:L due:2days depends:4 \
  +video +segment +money \
  annotate "Aerial drone shots, CPKC Stadium, empty luxury"

# Task 9: Segment 5 - The Wilfs
task add "Generate Segment 5: Wealth signifiers (8s)" \
  project:veo31 priority:L due:2days depends:4 \
  +video +segment +money \
  annotate "Rolex, contracts, champagne, greed aesthetic"
```

---

## PHASE 2: TEXT OVERLAY PREPARATION

```bash
# Task 10: Create text overlay script
task add "Script all text overlays with exact timing" \
  project:veo31 priority:H due:tomorrow depends:1,2,3,4,5,6,7,8,9 \
  +text +postproduction \
  annotate "18 text overlays, specific timestamps, $30M verification"

# Task 11: Verify dollar amounts
task add "Verify $30 million and $117 million display correctly" \
  project:veo31 priority:H due:tomorrow depends:10 \
  +text +critical +qa \
  annotate "CRITICAL: Escape dollar signs properly"

# Task 12: Design text styling
task add "Design text overlay styles and animations" \
  project:veo31 priority:M due:tomorrow depends:10 \
  +text +design \
  annotate "Helvetica Neue, white, 40% shadow, 0.7s fade"
```

---

## PHASE 3: ASSEMBLY & POST-PRODUCTION

### Phase 3A: Video Assembly

```bash
# Task 13: Import and sequence segments
task add "Import all 8 segments in correct order" \
  project:veo31 priority:H due:2days depends:1,2,3,4,5,6,7,8,9 \
  +assembly +editing \
  annotate "7x8s + 1x4s = 60s total"

# Task 14: Add transitions
task add "Add cross-dissolve transitions between segments" \
  project:veo31 priority:M due:2days depends:13 \
  +assembly +transitions \
  annotate "0.5s dissolves, sharp cut between 5-6"

# Task 15: Layer orchestral score
task add "Sync Lyria score to video timeline" \
  project:veo31 priority:H due:2days depends:13,3 \
  +assembly +audio \
  annotate "60s orchestral masterpiece, -3dB level"
```

### Phase 3B: Text Overlay Implementation

```bash
# Task 16: Apply text overlays
task add "Add all 18 text overlays at specified timestamps" \
  project:veo31 priority:H due:2days depends:13,10,11 \
  +assembly +text \
  annotate "Commissioner @10s, Kang @20s, Policy @44s, etc."

# Task 17: Add watermark and hashtag
task add "Add @asphaltcowb0y watermark and #StopTheInsanity" \
  project:veo31 priority:H due:2days depends:16 \
  +assembly +branding \
  annotate "Watermark always visible, hashtag @54-60s"
```

### Phase 3C: Final Polish

```bash
# Task 18: Color grading
task add "Color grade for consistency across segments" \
  project:veo31 priority:M due:2days depends:14,15,16,17 \
  +postproduction +color \
  annotate "Match color temperature, add film grain 3%"

# Task 19: Audio mastering
task add "Master audio levels and add ambient sounds" \
  project:veo31 priority:L due:2days depends:15 \
  +postproduction +audio \
  annotate "Music -3dB, ambient -18dB, optional sounds"

# Task 20: Final render
task add "Export final 1080p MP4 for X/Twitter" \
  project:veo31 priority:H due:2days depends:18,19 \
  +export +delivery \
  annotate "1080p, optimized for social media, 60s exact"
```

---

## PHASE 4: QUALITY ASSURANCE

```bash
# Task 21: Technical QA
task add "Verify video specs: 60s, 1080p, proper codec" \
  project:veo31 priority:H due:2days depends:20 \
  +qa +technical \
  annotate "Check duration, resolution, bitrate, audio sync"

# Task 22: Content verification
task add "Verify all text overlays display correctly" \
  project:veo31 priority:H due:2days depends:20 \
  +qa +content +critical \
  annotate "MUST CHECK: $30 million, $117 million, all names"

# Task 23: Platform testing
task add "Test upload to X/Twitter platform" \
  project:veo31 priority:M due:2days depends:20 \
  +qa +platform \
  annotate "Verify playback, quality, metadata"

# Task 24: Final approval
task add "Final review and sign-off on complete video" \
  project:veo31 priority:H due:2days depends:21,22,23 \
  +qa +approval +milestone \
  annotate "Ready for distribution"
```

---

## PHASE 5: DELIVERY & ARCHIVAL

```bash
# Task 25: Create delivery package
task add "Package final video with all assets" \
  project:veo31 priority:M due:3days depends:24 \
  +delivery +archive \
  annotate "Video, segments, score, project files"

# Task 26: Upload to distribution
task add "Upload to X/Twitter and backup locations" \
  project:veo31 priority:H due:3days depends:24 \
  +delivery +distribution \
  annotate "Post with #StopTheInsanity hashtag"

# Task 27: Archive project
task add "Archive all project files to long-term storage" \
  project:veo31 priority:L due:3days depends:25,26 \
  +archive +completion \
  annotate "Complete project backup"
```

---

## EXECUTION COMMANDS

### Start Phase 1 (Priority Segments)
```bash
# Start critical path tasks
task 1 start  # Begin Segment 1
timew start veo31.segment1

# After completion
task 1 done
task 2 start  # Move to Segment 8
```

### Monitor Progress
```bash
# View active tasks
task project:veo31 active

# Check dependencies
task project:veo31 blocked

# View next priorities
task project:veo31 next

# Time tracking
timew summary veo31
```

### Complete Project
```bash
# Mark project complete
task project:veo31 done

# Generate final report
task project:veo31 completed
timew report veo31
```

---

## CRITICAL CHECKPOINTS

### ✅ Phase 1 Checkpoint
- [ ] All 8 segments generated
- [ ] Lyria score completed
- [ ] Files organized in segments/ and music/

### ✅ Phase 2 Checkpoint
- [ ] Text overlay script verified
- [ ] Dollar amounts display correctly ($30M, $117M)
- [ ] Styling specifications documented

### ✅ Phase 3 Checkpoint
- [ ] Video assembled to exactly 60 seconds
- [ ] All text overlays at correct timestamps
- [ ] Audio synced properly

### ✅ Phase 4 Checkpoint
- [ ] Technical specs verified
- [ ] Content accuracy confirmed
- [ ] Platform compatibility tested

### ✅ Phase 5 Checkpoint
- [ ] Final video delivered
- [ ] Project archived
- [ ] Distribution completed

---

## DEPENDENCY GRAPH

```
Priority Segments (1,2,3) ─┐
                           ├─→ Assembly (13-17) ─→ Polish (18-19) ─→ Export (20) ─→ QA (21-24) ─→ Delivery (25-27)
Emotional Segments (4,5) ──┤
Corporate Segments (6-9) ──┘
                    ↓
            Text Prep (10-12)
```

---

## URGENCY FORMULA

Tasks are prioritized by:
1. **Critical path** - Segments 1, 8, and Lyria score
2. **Dependencies** - Blocked tasks automatically lower
3. **Due dates** - Today > Tomorrow > 2days > 3days
4. **Tags** - +critical > +emotional > +corporate

---

## SUCCESS METRICS

```bash
# Total tasks in project
task count project:veo31

# Completion rate
task project:veo31 completed count

# Time investment
timew summary veo31

# Critical path efficiency
task project:veo31 +critical completed
```

---

## NOTES

- **CRITICAL**: Segment 3 MUST show "$30 million+" not "$0 million"
- **CRITICAL**: Segment 4 MUST show "$117 million stadium"
- **CRITICAL**: Segment 6 MUST show policy text about testosterone blockers
- **Watermark**: @asphaltcowb0y throughout entire video
- **Hashtag**: #StopTheInsanity visible final 6 seconds
- **Duration**: Exactly 60 seconds (7×8s + 1×4s)

---

**Generated:** 2025-11-07 22:32
**Author:** Claude Code
**Project:** VEO 3.1 Documentary - NWSL