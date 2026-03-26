# NWSL Documentary Segment Generation Guide

**Created:** 2025-11-08
**Purpose:** Comprehensive guide for generating all 8 video segments using Vertex AI Veo 3.0
**Status:** Production-ready

---

## Overview

This guide covers the complete workflow for generating all 8 segments of the NWSL documentary using the explicit soccer context approach that proved successful with SEG-01.

## Key Learning: Explicit Soccer Context

**CRITICAL:** Veo 3.0 frequently generates non-soccer visuals (offices, American football fields) unless given EXTREMELY explicit soccer context.

### What Works (SEG-01 Success Pattern)

```
"Young female soccer players aged 12-14 wearing colorful soccer jerseys on grass
soccer field with visible white chalk lines, soccer goals with nets, corner flags.
Girls actively playing soccer, kicking round soccer ball, running on field..."
```

### What Doesn't Work

```
"Girls playing on field" ❌ (too vague, generates offices/boardrooms)
"Athletic field" ❌ (generates American football fields)
"Sports field" ❌ (generates wrong sport)
```

---

## Segment Classification

### Soccer Segments (Need Explicit Context)

- **SEG-01:** The Innocence (youth soccer)
- **SEG-04:** The Stadium (soccer-specific venue)
- **SEG-07:** The Confusion (return to soccer field)
- **SEG-08:** The Question (soccer player in stadium)

**Strategy:** Add explicit soccer context with field markings, equipment, and strong negative prompts against American football.

### Non-Soccer Segments (No Soccer Context)

- **SEG-02:** The Commissioner (corporate office)
- **SEG-03:** Michele Kang (financial/investment)
- **SEG-05:** The Wilfs (wealth/money)
- **SEG-06:** The Policy (medical/clinical)

**Strategy:** Use negative prompts to avoid soccer/sports elements that would conflict with corporate/medical settings.

---

## Scripts

### 1. Generate All Segments

**File:** `/home/jeremy/000-projects/hustle/nwsl/050-scripts/generate_all_segments_explicit.sh`

**Purpose:** Submit all 8 segments to Vertex AI Veo 3.0 with proper soccer context

**Usage:**

```bash
# Generate all segments
cd /home/jeremy/000-projects/hustle/nwsl
./050-scripts/generate_all_segments_explicit.sh

# Resume generation (skip already downloaded segments)
./050-scripts/generate_all_segments_explicit.sh --resume
```

**Features:**
- Loads canon prompts from `000-docs/004-DR-REFF-veo-seg-*.md`
- Adds explicit soccer context to SEG-01, 04, 07, 08
- Strong negative prompts against American football, offices, etc.
- Submits to Veo 3.0 with proper parameters (24fps, 1080p, 8s duration)
- Waits 90 seconds and attempts download
- Comprehensive logging to `007-logs/generation/`

**Output:**
- Videos: `003-raw-segments/SEG-01.mp4` through `SEG-08.mp4`
- Previews: `003-raw-segments/SEG-*_preview.png`
- Logs: `007-logs/generation/generate_all_YYYYMMDD_HHMMSS.log`
- Operations: `007-logs/generation/seg*_operation.txt`

### 2. Monitor Generation Progress

**File:** `/home/jeremy/000-projects/hustle/nwsl/050-scripts/monitor_segments.sh`

**Purpose:** Check status of all segments (local files + cloud storage)

**Usage:**

```bash
cd /home/jeremy/000-projects/hustle/nwsl
./050-scripts/monitor_segments.sh
```

**Output:**
- ✅ Completed: Already downloaded locally
- ⏳ Processing: Ready to download from cloud
- ❌ Missing: Not yet generated or still rendering

**Exit Codes:**
- `0`: All 8 segments complete
- `1`: All generated, some still downloading
- `2`: Some segments missing

### 3. Download Ready Segments

**File:** `/home/jeremy/000-projects/hustle/nwsl/050-scripts/download_ready_segments.sh`

**Purpose:** Download all segments that are ready in cloud storage

**Usage:**

```bash
cd /home/jeremy/000-projects/hustle/nwsl
./050-scripts/download_ready_segments.sh
```

**Features:**
- Checks for existing local files (skips re-download)
- Finds videos in cloud storage
- Downloads to `003-raw-segments/`
- Extracts preview frames
- Reports file size and duration
- Comprehensive logging

---

## Workflow

### Initial Generation

```bash
# Step 1: Generate all segments
cd /home/jeremy/000-projects/hustle/nwsl
./050-scripts/generate_all_segments_explicit.sh

# Wait 90-120 seconds for rendering

# Step 2: Check status
./050-scripts/monitor_segments.sh

# Step 3: Download ready segments
./050-scripts/download_ready_segments.sh
```

### Resume After Partial Failure

```bash
# Check what's missing
./050-scripts/monitor_segments.sh

# Re-generate only missing segments
./050-scripts/generate_all_segments_explicit.sh --resume

# Download newly ready segments
./050-scripts/download_ready_segments.sh
```

### Manual Download

If a specific segment is ready but script fails:

```bash
# Find the video path
gsutil ls 'gs://pipelinepilot-prod-veo-videos/seg01_explicit/**/*.mp4'

# Download manually
gsutil cp 'gs://path/to/video.mp4' 003-raw-segments/SEG-01.mp4
```

---

## Segment Specifications

### SEG-01: The Innocence (8.0s)

**Canon:** `000-docs/004-DR-REFF-veo-seg-01.md`
**Context:** Youth soccer field, girls playing soccer
**Key Elements:** Soccer jerseys, round ball, field markings, goals with nets
**Negative:** Office, boardroom, American football

### SEG-02: The Commissioner (8.0s)

**Canon:** `000-docs/005-DR-REFF-veo-seg-02.md`
**Context:** Empty corporate executive office
**Key Elements:** Dark wood desk, nameplate, city skyline, cold atmosphere
**Negative:** Soccer, sports, athletes, stadium

### SEG-03: Michele Kang - The Investment (8.0s)

**Canon:** `000-docs/006-DR-REFF-veo-seg-03.md`
**Context:** Luxury corporate office, financial documents
**Key Elements:** Fountain pen, $30M check, investment portfolios, stadium construction
**Negative:** People in frame, faces, athletes

### SEG-04: Angie Long - The Stadium (8.0s)

**Canon:** `000-docs/007-DR-REFF-veo-seg-04.md`
**Context:** CPKC Stadium aerial view, soccer-specific venue
**Key Elements:** Soccer field markings, goals, empty stadium, luxury suites
**Negative:** American football field, gridiron, yard lines, goalposts

### SEG-05: The Wilfs - The Money (8.0s)

**Canon:** `000-docs/008-DR-REFF-veo-seg-05.md`
**Context:** Upscale executive environment, wealth signifiers
**Key Elements:** Rolex, contracts, cash, financial statements, luxury box
**Negative:** Soccer players, athletes, sports action

### SEG-06: The Policy - Medical Reality (8.0s)

**Canon:** `000-docs/009-DR-REFF-veo-seg-06.md`
**Context:** Clinical medical environment
**Key Elements:** Examination room, medication bottles, test tubes, consent forms
**Negative:** Readable text, specific drug names, people, surgical procedures

### SEG-07: The Confusion (8.0s)

**Canon:** `000-docs/010-DR-REFF-veo-seg-07.md`
**Context:** Soccer field at dusk, girls looking confused
**Key Elements:** Soccer ball, bench, field markings, goals silhouetted, twilight
**Negative:** Happy expressions, celebration, American football

### SEG-08: The Unanswered Question (4.0s)

**Canon:** `000-docs/011-DR-REFF-veo-seg-08.md`
**Context:** Close-up of teen soccer player in empty stadium
**Key Elements:** Soccer uniform, tear on cheek, stadium blurred behind, emotional
**Negative:** Smiling, happy, multiple people in focus

---

## Prompt Engineering Principles

### 1. Explicit Sport Identification

**DO:**
- "soccer field with white chalk lines"
- "round soccer ball"
- "soccer goals with nets"
- "soccer jerseys"

**DON'T:**
- "field" (too vague)
- "ball" (could be any sport)
- "goals" (could be American football)
- "uniforms" (not sport-specific)

### 2. Strong Negative Prompts

**Soccer segments:**
```
"office, boardroom, documents, papers, desk, computer, indoor meeting,
conference room, American football, gridiron, yard lines, goalposts
with uprights, oval ball, football helmet"
```

**Non-soccer segments:**
```
"soccer, sports, athletic equipment, stadium, field, athletes"
```

### 3. Universal Negatives (All Segments)

```
"text, watermark, logo, brand, Nike, Adidas, timestamp, caption,
subtitle, name tag, scoreboard text, readable signs, Getty Images,
copyright notice"
```

### 4. Context Addition Pattern

For soccer segments, append:
```
"Context: professional women's soccer (NWSL) and elite youth soccer (ECNL).
Use authentic SOCCER visuals only. Pitch: full-size soccer field with white
touchlines, halfway line, center circle, penalty boxes, corner flags. Round
soccer ball. Soccer jerseys. Soccer goals with nets. Grass or turf field surface."
```

---

## Technical Parameters

### Veo 3.0 API Configuration

```json
{
  "instances": [{
    "prompt": "...",
    "negativePrompt": "...",
    "aspectRatio": "16:9",
    "generateAudio": false,
    "durationSecs": 8
  }],
  "parameters": {
    "frameRate": 24,
    "resolution": "1080p",
    "sampleCount": 1,
    "storageUri": "gs://pipelinepilot-prod-veo-videos/seg##_explicit/"
  }
}
```

### Expected Generation Times

- **Submission:** 1-2 seconds
- **Rendering:** 60-120 seconds
- **Download:** 5-15 seconds (depends on file size)

**Total per segment:** ~90-150 seconds

### File Specifications

- **Format:** MP4 (H.264)
- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 24fps
- **Duration:** 8.0s (SEG-01 through SEG-07), 4.0s (SEG-08)
- **Audio:** None (generateAudio: false)
- **Expected Size:** 15-30 MB per segment

---

## Troubleshooting

### Problem: Segment generates office/boardroom instead of soccer

**Solution:**
- Add more explicit soccer context
- Strengthen negative prompts
- Use specific field markings: "white chalk lines, center circle, penalty box"
- Mention equipment: "round soccer ball, soccer goals with nets"

### Problem: Segment generates American football field

**Solution:**
- Add to negative prompt: "American football, gridiron, yard lines, uprights, oval ball"
- Be explicit: "SOCCER field, not American football"
- Describe field: "grass field with white touchlines and center circle"

### Problem: Generation fails or times out

**Solution:**
- Check gcloud authentication: `gcloud auth application-default print-access-token`
- Verify quota: `gcloud compute project-info describe --project=pipelinepilot-prod`
- Check logs: `007-logs/generation/generate_all_*.log`
- Wait longer (some renders take 180+ seconds)

### Problem: Video downloaded but wrong content

**Solution:**
- Review preview frame: `003-raw-segments/SEG-##_preview.png`
- Check prompt in log file
- Re-generate with modified prompt
- Use `--resume` flag to skip good segments

---

## Quality Checks

### Automated Checks (in scripts)

- ✅ File exists
- ✅ File size > 1 MB
- ✅ Duration within ±1 second
- ✅ Preview frame extraction successful

### Manual Visual Checks

For each segment, verify:

1. **Content Match:** Does it match the canon description?
2. **Sport Correct:** Soccer (not American football or other sport)
3. **No Text:** No readable text, watermarks, logos
4. **No Artifacts:** No distorted faces, wrong equipment, impossible physics
5. **Quality:** 1080p, 24fps, smooth motion
6. **Duration:** Correct length (8s or 4s)

### QC Workflow

```bash
# Generate preview frames for all segments
for seg in 003-raw-segments/SEG-*.mp4; do
    name=$(basename "$seg" .mp4)
    ffmpeg -ss 2 -i "$seg" -frames:v 1 "003-raw-segments/${name}_preview.png"
done

# Open all previews for visual inspection
open 003-raw-segments/*_preview.png
```

---

## Next Steps After Generation

Once all 8 segments are generated and verified:

1. **QC Review:** Visual inspection of all segments
2. **Assembly:** Use `050-scripts/ffmpeg_assembly_9seg.sh` to merge segments
3. **Overlay Addition:** Apply text overlays in Phase 2B
4. **Audio Integration:** Add Lyria music track
5. **Final Export:** Render complete documentary

---

## Files Reference

### Scripts
- `050-scripts/generate_all_segments_explicit.sh` - Main generation script
- `050-scripts/monitor_segments.sh` - Status monitor
- `050-scripts/download_ready_segments.sh` - Download helper

### Canon Documents
- `000-docs/004-DR-REFF-veo-seg-01.md` through `011-DR-REFF-veo-seg-08.md`

### Output Directories
- `003-raw-segments/` - Downloaded video files
- `007-logs/generation/` - Logs and operation tracking

### Cloud Storage
- `gs://pipelinepilot-prod-veo-videos/seg01_explicit/` through `seg08_explicit/`

---

**End of Guide**

**Created:** 2025-11-08
**Last Updated:** 2025-11-08
**Version:** 1.0
