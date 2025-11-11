# Export Specifications
**Version:** 1.0
**Date:** 2025-11-07
**Purpose:** Technical specifications for all video export formats
**Project:** Why Won't They Answer? (60-second documentary)

---

## MASTER EXPORT SPECIFICATIONS

### Primary Deliverable
- **Filename:** `why_wont_they_answer_master.mp4`
- **Location:** `060-renders/final/`
- **Container:** MP4 (MPEG-4 Part 14)
- **Duration:** 60.04 seconds (±0.5s tolerance)
- **File Size:** ~150-200MB (estimated)

### Video Specifications
- **Codec:** H.264/AVC (x264)
- **Profile:** High Profile, Level 4.1
- **Resolution:** 1920×1080 (16:9)
- **Frame Rate:** 24fps constant
- **Bit Rate:** 20 Mbps VBR
- **Quality:** CRF 18 (visually lossless)
- **Pixel Format:** yuv420p
- **Color Space:** Rec.709
- **Scan Type:** Progressive
- **GOP Size:** 48 frames (2 seconds)

### Audio Specifications
- **Codec:** AAC-LC
- **Sample Rate:** 48 kHz
- **Channels:** Stereo (2.0)
- **Bit Rate:** 320 kbps CBR
- **Loudness:** -14 LUFS (±1)
- **True Peak:** ≤ -1.0 dBTP
- **Dynamic Range:** 7 LU minimum

---

## EXPORT COMMAND

### Master Export
```bash
ffmpeg -i 030-video/assembly/final_with_overlays.mp4 \
  -c:v libx264 -preset slow -crf 18 \
  -profile:v high -level 4.1 \
  -pix_fmt yuv420p \
  -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
  -g 48 -bf 2 \
  -c:a aac -b:a 320k -ar 48000 \
  -movflags +faststart \
  -metadata title="Why Won't They Answer?" \
  -metadata artist="@asphaltcowb0y" \
  -metadata year="2025" \
  -metadata comment="NWSL Documentary" \
  060-renders/final/why_wont_they_answer_master.mp4
```

---

## ALTERNATE VERSIONS

### 1. Social Media - Vertical (9:16)
```bash
# TikTok/Reels/Shorts
ffmpeg -i 060-renders/final/why_wont_they_answer_master.mp4 \
  -vf "crop=608:1080:656:0,scale=1080:1920" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 256k \
  -movflags +faststart \
  060-renders/social/why_vertical_9x16.mp4
```
- **Resolution:** 1080×1920
- **Bit Rate:** 8 Mbps
- **File Size:** ~60MB

### 2. Social Media - Square (1:1)
```bash
# Instagram Feed
ffmpeg -i 060-renders/final/why_wont_they_answer_master.mp4 \
  -vf "crop=1080:1080:420:0" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 256k \
  -movflags +faststart \
  060-renders/social/why_square_1x1.mp4
```
- **Resolution:** 1080×1080
- **Bit Rate:** 6 Mbps
- **File Size:** ~45MB

### 3. Twitter/X Optimized
```bash
# Twitter/X (under 512MB, optimized)
ffmpeg -i 060-renders/final/why_wont_they_answer_master.mp4 \
  -c:v libx264 -preset slow -crf 20 \
  -maxrate 15M -bufsize 30M \
  -c:a aac -b:a 256k \
  -movflags +faststart \
  060-renders/social/why_twitter_optimized.mp4
```
- **Max Bit Rate:** 15 Mbps
- **File Size:** <100MB

### 4. Web Streaming (HLS)
```bash
# HLS for adaptive streaming
ffmpeg -i 060-renders/final/why_wont_they_answer_master.mp4 \
  -c:v libx264 -crf 23 -g 48 \
  -c:a aac -b:a 128k \
  -f hls -hls_time 4 -hls_playlist_type vod \
  -hls_segment_filename "060-renders/streaming/segment_%03d.ts" \
  060-renders/streaming/playlist.m3u8
```

### 5. ProRes Archive
```bash
# ProRes 422 HQ for archival
ffmpeg -i 060-renders/final/why_wont_they_answer_master.mp4 \
  -c:v prores_ks -profile:v 3 \
  -c:a pcm_s16le \
  060-renders/archive/why_prores_422hq.mov
```
- **Codec:** ProRes 422 HQ
- **File Size:** ~1.5GB

---

## QUALITY CONTROL SPECIFICATIONS

### Technical QC Checks
```bash
# Video stream analysis
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,duration,codec_name,profile,level \
  -of default=noprint_wrappers=1 \
  060-renders/final/why_wont_they_answer_master.mp4

# Audio loudness analysis
ffmpeg -i 060-renders/final/why_wont_they_answer_master.mp4 \
  -af ebur128=peak=true:framelog=quiet \
  -f null -
```

### Required Pass Criteria
- [x] Duration: 60.0s ±0.5s
- [x] Resolution: Exactly 1920×1080
- [x] Frame Rate: Exactly 24fps
- [x] Audio Loudness: -14 LUFS ±1
- [x] True Peak: ≤ -1.0 dBTP
- [x] No dropped frames
- [x] No audio clipping
- [x] Text overlays readable
- [x] Dollar amounts display correctly
- [x] Watermark visible at 40% opacity

---

## METADATA SPECIFICATIONS

### Required Metadata
```
Title: Why Won't They Answer?
Artist: @asphaltcowb0y
Album: NWSL Documentary Series
Year: 2025
Genre: Documentary
Comment: A 60-second documentary examining NWSL transgender policy
Copyright: Creative Commons BY-SA 4.0
Language: English
```

### Thumbnail Generation
```bash
# Extract poster frame at 30 seconds
ffmpeg -ss 30 -i 060-renders/final/why_wont_they_answer_master.mp4 \
  -vframes 1 -q:v 2 \
  060-renders/final/thumbnail.jpg
```

---

## DELIVERY PACKAGE STRUCTURE

```
060-renders/
├── final/
│   ├── why_wont_they_answer_master.mp4     # Primary deliverable
│   ├── why_no_music.mp4                    # Version without music
│   ├── why_no_overlays.mp4                 # Clean video only
│   └── thumbnail.jpg                       # Poster frame
├── social/
│   ├── why_vertical_9x16.mp4              # TikTok/Reels
│   ├── why_square_1x1.mp4                 # Instagram
│   └── why_twitter_optimized.mp4          # Twitter/X
├── streaming/
│   ├── playlist.m3u8                      # HLS manifest
│   └── segment_*.ts                       # HLS segments
└── archive/
    ├── why_prores_422hq.mov              # ProRes master
    ├── project_files.zip                  # Source files
    └── checksums.md5                      # File integrity
```

---

## PLATFORM-SPECIFIC REQUIREMENTS

### YouTube
- **Format:** MP4 H.264
- **Resolution:** 1920×1080
- **Frame Rate:** 24fps
- **Bit Rate:** 8-12 Mbps
- **Audio:** AAC 384 kbps

### Vimeo
- **Format:** MP4 H.264 or ProRes
- **Resolution:** 1920×1080 or higher
- **Bit Rate:** No limit
- **Color Space:** Rec.709

### Twitter/X
- **Format:** MP4 H.264
- **Max Duration:** 2:20 (we're at 1:00 ✓)
- **Max Size:** 512MB (we're ~100MB ✓)
- **Resolution:** Up to 1920×1080 ✓

### Instagram
- **Feed:** 1:1 aspect, 60s max ✓
- **Reels:** 9:16 aspect, 90s max ✓
- **IGTV:** 16:9 aspect, 60s min ✓

### TikTok
- **Aspect:** 9:16 vertical
- **Duration:** 60s ✓
- **Resolution:** 1080×1920
- **Frame Rate:** 24-60fps

---

## COLOR GRADING SPECIFICATIONS

### Target Look
- **Overall:** Slightly desaturated documentary aesthetic
- **Shadows:** Lifted to 5 IRE
- **Highlights:** Compressed to 95 IRE
- **Midtones:** Neutral with slight cool push
- **Contrast:** 1.1 ratio

### Segment-Specific Grades
| Segment | Color Temperature | Saturation | Notes |
|---------|------------------|------------|-------|
| SEG-01 | Warm (5600K) | 100% | Innocence baseline |
| SEG-02 | Cool (4500K) | 85% | Institutional cold |
| SEG-03 | Neutral (5000K) | 90% | Financial tension |
| SEG-04 | Daylight (5600K) | 95% | Stadium grandeur |
| SEG-05 | Neutral (5200K) | 80% | Boardroom oppression |
| SEG-06 | Clinical (4200K) | 70% | Medical horror |
| SEG-07 | Desaturated | 65% | Lost innocence |
| SEG-08 | High Contrast | 110% | Confrontational |

---

## COMPRESSION SETTINGS

### Two-Pass Encoding (Optional for smaller files)
```bash
# First pass
ffmpeg -i input.mp4 -c:v libx264 -preset slow -b:v 15M \
  -pass 1 -an -f null /dev/null

# Second pass
ffmpeg -i input.mp4 -c:v libx264 -preset slow -b:v 15M \
  -pass 2 -c:a aac -b:a 320k \
  output.mp4
```

---

## VALIDATION SCRIPT

```bash
#!/bin/bash
# validate_export.sh

FILE="060-renders/final/why_wont_they_answer_master.mp4"

echo "Validating export: $FILE"

# Check duration
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FILE")
echo "Duration: $DURATION seconds"

# Check resolution
RESOLUTION=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$FILE")
echo "Resolution: $RESOLUTION"

# Check frame rate
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "$FILE")
echo "Frame rate: $FPS"

# Check loudness
ffmpeg -i "$FILE" -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep "I:"
```

---

## EMERGENCY RECOVERY

### If Export Fails
1. Check available disk space (need 10GB free)
2. Verify source files exist and are readable
3. Test with lower quality settings first (CRF 23)
4. Use simpler preset (-preset fast)
5. Remove metadata if causing issues
6. Export video and audio separately, then mux

---

**Specifications Generated:** 2025-11-07
**Export Ready:** Upon completion of assembly
**Estimated Processing Time:** 5-10 minutes per export

**END OF EXPORT SPECIFICATIONS**