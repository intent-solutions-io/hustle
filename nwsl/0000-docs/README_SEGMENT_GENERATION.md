# NWSL Segment Generation - Quick Start

## TL;DR - Three Commands

```bash
# 1. Generate all 8 segments
./050-scripts/generate_all_segments_explicit.sh

# 2. Check status
./050-scripts/monitor_segments.sh

# 3. Download ready segments
./050-scripts/download_ready_segments.sh
```

---

## Full Workflow

### Initial Generation

```bash
cd /home/jeremy/000-projects/hustle/nwsl

# Submit all segments to Veo 3.0
./050-scripts/generate_all_segments_explicit.sh

# Wait 90-120 seconds for rendering...

# Check what's ready
./050-scripts/monitor_segments.sh

# Download completed segments
./050-scripts/download_ready_segments.sh
```

### Resume After Partial Success

```bash
# Check what's missing
./050-scripts/monitor_segments.sh

# Generate only missing segments
./050-scripts/generate_all_segments_explicit.sh --resume

# Download newly ready segments
./050-scripts/download_ready_segments.sh
```

---

## Script Descriptions

### generate_all_segments_explicit.sh

**What it does:**
- Loads canon prompts from `000-docs/004-DR-REFF-veo-seg-*.md`
- Adds explicit SOCCER context to segments 01, 04, 07, 08
- Strong negative prompts to avoid American football, offices
- Submits all 8 segments to Vertex AI Veo 3.0
- Waits 90 seconds and attempts first download
- Logs everything to `007-logs/generation/`

**Options:**
- No args: Generate all 8 segments
- `--resume`: Skip segments already downloaded

**Output:**
- Videos: `003-raw-segments/SEG-*.mp4`
- Previews: `003-raw-segments/SEG-*_preview.png`
- Logs: `007-logs/generation/generate_all_*.log`

### monitor_segments.sh

**What it does:**
- Checks local files for already downloaded segments
- Queries cloud storage for ready-to-download segments
- Shows which segments are still rendering
- Provides download commands for ready segments

**Exit codes:**
- `0`: All 8 complete
- `1`: All generated, some downloading
- `2`: Some still missing/rendering

### download_ready_segments.sh

**What it does:**
- Scans cloud storage for completed videos
- Downloads to `003-raw-segments/`
- Skips already downloaded files
- Extracts preview frames
- Reports file size and duration
- Comprehensive logging

---

## Key Learning: Explicit Soccer Context

**CRITICAL:** Veo 3.0 generates offices/boardrooms unless given EXPLICIT soccer details.

### Works (SEG-01 Success)

```
"Young female soccer players aged 12-14 wearing colorful soccer jerseys
on grass soccer field with visible white chalk lines, soccer goals with
nets, corner flags. Girls actively playing soccer, kicking round soccer
ball, running on field..."
```

### Doesn't Work

```
❌ "Girls playing on field" - too vague
❌ "Athletic field" - generates American football
❌ "Sports field" - wrong sport
```

---

## Segments Overview

| Segment | Duration | Context | Soccer Context? |
|---------|----------|---------|-----------------|
| SEG-01 | 8.0s | Youth playing soccer | ✅ YES - Explicit |
| SEG-02 | 8.0s | Corporate office | ❌ NO - Avoid sports |
| SEG-03 | 8.0s | Financial investment | ❌ NO - Corporate |
| SEG-04 | 8.0s | Empty soccer stadium | ✅ YES - Explicit |
| SEG-05 | 8.0s | Wealth/money | ❌ NO - Avoid sports |
| SEG-06 | 8.0s | Medical clinical | ❌ NO - Medical only |
| SEG-07 | 8.0s | Field at dusk, confusion | ✅ YES - Explicit |
| SEG-08 | 4.0s | Close-up, emotional | ✅ YES - Soccer uniform |

---

## Expected Timings

- **Submission:** 1-2 seconds per segment
- **Rendering:** 60-120 seconds typical
- **Download:** 5-15 seconds
- **Total:** 90-150 seconds per segment

For all 8 segments: **12-20 minutes end-to-end**

---

## Troubleshooting

### Authentication Error

```bash
gcloud auth application-default login
```

### Check Quota

```bash
gcloud compute project-info describe --project=pipelinepilot-prod
```

### Manual Download

```bash
# Find video path
gsutil ls 'gs://pipelinepilot-prod-veo-videos/seg01_explicit/**/*.mp4'

# Download
gsutil cp 'gs://path/to/video.mp4' 003-raw-segments/SEG-01.mp4
```

### View Logs

```bash
# Latest generation log
ls -lt 007-logs/generation/generate_all_*.log | head -1

# View log
tail -f 007-logs/generation/generate_all_YYYYMMDD_HHMMSS.log
```

---

## Quality Checks

After generation, verify each segment:

```bash
# Extract preview frames
for seg in 003-raw-segments/SEG-*.mp4; do
    name=$(basename "$seg" .mp4)
    ffmpeg -ss 2 -i "$seg" -frames:v 1 "003-raw-segments/${name}_mid.png"
done

# Check durations
for seg in 003-raw-segments/SEG-*.mp4; do
    echo -n "$(basename $seg): "
    ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$seg"
done
```

**Visual checks:**
- ✅ Content matches canon
- ✅ Correct sport (soccer, not American football)
- ✅ No text, watermarks, logos
- ✅ No face distortions or artifacts
- ✅ 1080p quality, 24fps
- ✅ Correct duration (8s or 4s)

---

## Next Steps

Once all 8 segments verified:

1. **Assemble:** `050-scripts/ffmpeg_assembly_9seg.sh`
2. **Add overlays:** Phase 2B overlay application
3. **Add music:** Lyria audio integration
4. **Export:** Final documentary render

---

## Files

**Scripts:**
- `050-scripts/generate_all_segments_explicit.sh`
- `050-scripts/monitor_segments.sh`
- `050-scripts/download_ready_segments.sh`

**Canon:**
- `000-docs/004-DR-REFF-veo-seg-01.md` through `011-DR-REFF-veo-seg-08.md`

**Output:**
- `003-raw-segments/SEG-*.mp4` - Videos
- `007-logs/generation/` - Logs

**Cloud:**
- `gs://pipelinepilot-prod-veo-videos/seg01_explicit/` through `seg08_explicit/`

---

**Full Guide:** See `000-docs/032-DR-GUID-segment-generation-guide.md`
