# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NWSL Video Generation Suite - A collection of tools for generating photorealistic cinematic videos using Google Vertex AI's Veo 3.0/3.1 models and Lyria for orchestral music generation. Primarily focused on creating documentary-style content about NWSL (National Women's Soccer League) policy issues.

## Architecture

### Core Components

**Video Generation Pipeline:**
- Veo 3.0/3.1 API integration for photorealistic video generation
- Lyria API for orchestral score generation
- Cloud Run merger service for concatenating multiple clips
- FFmpeg for post-production (watermarking, text overlays, audio mixing)

**GCP Configuration:**
- Project: `pipelinepilot-prod`
- Region: `us-central1`
- Storage Bucket: `gs://pipelinepilot-prod-veo-videos`
- Cloud Run Service: `https://video-merger-365258353703.us-central1.run.app`

### Cost Structure
- 8-second video: $6
- 15-second video: ~$11
- 40-second video: ~$30-45
- 60-90 second video: ~$45-68

## Common Commands

### Setup Environment

```bash
# Activate Python virtual environment
source venv-videos/bin/activate

# Install dependencies
pip install -r requirements-video.txt

# Authenticate with Google Cloud
gcloud auth application-default login
export GCP_PROJECT_ID="pipelinepilot-prod"
export GCP_LOCATION="us-central1"
```

### Generate Videos

```bash
# Generate simple NWSL policy videos (5x 8-second clips)
python generate_nwsl_videos.py

# Generate cinematic B-roll with voiceover (60-90 seconds)
python generate_cinematic_broll.py

# Fully automated pipeline (generates, merges, watermarks)
./generate_nwsl_final.sh

# Test Veo 3 lipsync capabilities
python test_veo3_lipsync.py
```

### Cloud Video Merger

```bash
# Deploy merger to Cloud Run (already deployed)
cd cloud_video_merger
gcloud run deploy video-merger \
  --source . \
  --region us-central1 \
  --project pipelinepilot-prod

# Merge videos locally
python merge_with_cloud_run.py
```

## Video Generation Scripts

### Main Scripts

**`generate_nwsl_final.sh`**
- Fully automated pipeline
- Generates 4 clips → waits for processing → merges in cloud → adds watermark → downloads
- Output: Single 32-second video ready for social media

**`generate_cinematic_broll.py`**
- Creates documentary-style videos with voiceover
- Generates multiple scenes with emotional arc
- Includes TTS voice generation via Google Cloud Text-to-Speech
- Style: Nike commercial meets ESPN 30 for 30

**`generate_nwsl_videos.py`**
- Simple 8-second clip generator
- Creates 5 predefined policy-focused videos
- Each with specific messaging about NWSL trans policy

### API Integration Pattern

All scripts follow this pattern:
1. Get access token via `gcloud auth`
2. Send POST to Vertex AI endpoint with prompt
3. Poll for completion (async operation)
4. Download from GCS bucket or base64 decode
5. Save to local directory

## Prompt Engineering Guidelines

### Veo 3.0/3.1 Requirements
- Emphasize **PHOTOREALISTIC** and **LIVE-ACTION STYLE**
- Specify camera type (RED Komodo, ARRI Alexa)
- Include cinematography details (lighting, color grading, depth of field)
- **NO TEXT in video** - add overlays in post-production
- Duration must be specified (8s, 15s, 40s, etc.)

### Lyria Music Prompts
- Specify orchestral instrumentation
- Include tempo markings (Allegro, Andante, etc.)
- Describe emotional arc with timestamps
- Reference film scores for style (Hans Zimmer, Thomas Newman)
- Request "live orchestra recording quality"

## Project Status & Assets

### Completed Assets
- **B-Roll Video**: `videos/final/nwsl_cinematic_FINAL.mp4` (working 32-second video)
- **106 Masterpiece Images**: In `assets-masterpiece-110/` (warning: AI text has errors)
- **20 Board Exposé Graphics**: In `assets-board-expose/`

### Known Issues
- AI-generated text in images has spelling errors
- TTS voices can sound robotic - consider recording human voiceover
- Text should always be added in post-production, never in AI generation

## Post-Production Workflow

```bash
# Add watermark to video
ffmpeg -i input.mp4 -vf "drawtext=text='@asphaltcowb0y':x=w-tw-10:y=h-th-10:fontcolor=white:fontsize=24:shadowcolor=black:shadowx=2:shadowy=2" output.mp4

# Merge multiple videos
ffmpeg -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" -map "[v]" merged.mp4

# Add audio track
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -strict experimental final.mp4
```

## Documentation Index

Key documentation in `000-docs/`:
- `001-DR-REFF-nwsl-video-readme.md` - Original project overview
- `002-PP-PLAN-project-inventory.md` - Asset inventory and decision points
- `003-PP-PLAN-cinematic-broll.md` - Detailed B-roll generation plan
- `005-PM-DECI-decision-point.md` - Project strategy decisions
- `011-RA-ANLY-veo3-lipsync.md` - Veo 3 lipsync research
- `013-DR-REFF-veo-31-prompts.md` - Complete Veo 3.1 prompt collection

## Budget Tracking

- Initial budget: $3,000
- Spent: ~$47.65
- Remaining: ~$2,952.35
- Track costs carefully - each video generation has a price