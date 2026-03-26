# NWSL Policy Videos - Generation Guide

**5 hyper-realistic 8-second videos exposing NWSL trans policy issues**

Watermark: **@asphaltcowb0y** on all videos

---

## What These Videos Show

1. **The Loophole** - Policy allows biological males to compete
2. **The Door** - Women's sports opened to males
3. **One Voice** - Elizabeth Eddy spoke truth, teammates called her racist
4. **The Science** - Testosterone suppression only reduces male advantage 5%
5. **The Question** - If males compete, is it still women's sports?

---

## Cost Breakdown

- **Per video:** $6 (8 seconds with audio)
- **Total for 5 videos:** $30
- **Remaining credits:** $2,970 (from $3,000)

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd /home/jeremy/000-projects/iams/pipelinepilot

# Install Vertex AI SDK
pip install google-cloud-aiplatform
pip install vertexai

# Verify installation
python -c "import vertexai; print('✓ Vertex AI installed')"
```

### 2. Authenticate with Google Cloud

```bash
# Authenticate (opens browser)
gcloud auth application-default login

# Set project
export GCP_PROJECT_ID="pipelinepilot-prod"
export GCP_LOCATION="us-central1"

# Verify
gcloud config list
```

### 3. Enable Required APIs

```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=pipelinepilot-prod

# Enable Vision AI (for Veo)
gcloud services enable vision.googleapis.com --project=pipelinepilot-prod
```

---

## Generate Videos

### Run the script

```bash
cd /home/jeremy/000-projects/iams/pipelinepilot

# Make executable
chmod +x generate_nwsl_videos.py

# Run
python generate_nwsl_videos.py
```

### Expected Output

```
================================================================================
NWSL POLICY VIDEO GENERATOR - Vertex AI Veo 3
================================================================================
Videos to generate: 5
Total cost: $30 ($6 per video)
Output directory: ./nwsl_videos
================================================================================

[1/5] Processing: The Loophole
Sending request to Veo 3...
✓ Video generation complete
✓ Video saved: ./nwsl_videos/01_the_loophole.mp4

[2/5] Processing: The Door
...

================================================================================
GENERATION COMPLETE
================================================================================
Total videos generated: 5/5
Time elapsed: 182.3 seconds
Cost: $30

Generated videos:
  ✓ The Loophole: ./nwsl_videos/01_the_loophole.mp4
  ✓ The Door: ./nwsl_videos/02_the_door.mp4
  ✓ One Voice: ./nwsl_videos/03_one_voice.mp4
  ✓ The Science: ./nwsl_videos/04_the_science.mp4
  ✓ The Question: ./nwsl_videos/05_the_question.mp4

Ready to upload to X/Twitter!
================================================================================
```

---

## Video Files Output

All videos saved to: `./nwsl_videos/`

```
nwsl_videos/
├── 01_the_loophole.mp4    (8s, ~15MB, 16:9, with audio)
├── 02_the_door.mp4        (8s, ~15MB, 16:9, with audio)
├── 03_one_voice.mp4       (8s, ~15MB, 16:9, with audio)
├── 04_the_science.mp4     (8s, ~15MB, 16:9, with audio)
└── 05_the_question.mp4    (8s, ~15MB, 16:9, with audio)
```

---

## Upload to X/Twitter

### Recommended Posting Strategy

**Post one video per day for maximum engagement:**

**Day 1: "The Loophole"**
```
The NWSL policy allows biological males to compete in women's soccer.

10 nmol/L testosterone = MALE RANGE.

This is the "women's" league. 🤔

@asphaltcowb0y
```

**Day 2: "The Door"**
```
The NWSL opened the door to biological males competing against women.

Current policy = door is OPEN.

Is this really "women's" sports?

@asphaltcowb0y
```

**Day 3: "One Voice"**
```
One player spoke up for biological women in women's sports.

Her teammates called her RACIST.

Let that sink in.

@asphaltcowb0y
```

**Day 4: "The Science"**
```
Testosterone suppression reduces male advantage by only 5%.

FIVE PERCENT.

Biology doesn't lie. Science matters.

@asphaltcowb0y
```

**Day 5: "The Question"**
```
If biological males compete in women's sports...

...is it still women's sports?

Simple question. Answer honestly.

@asphaltcowb0y
```

---

## Troubleshooting

### Error: "API not enabled"
```bash
gcloud services enable aiplatform.googleapis.com --project=pipelinepilot-prod
```

### Error: "Permission denied"
```bash
gcloud auth application-default login
```

### Error: "Model not found"
```bash
# Veo 3 is in preview, check available models:
gcloud ai models list --region=us-central1
```

### Generation takes too long
- Each video takes ~30-40 seconds to generate
- Total time for 5 videos: ~3-5 minutes
- Script includes 5-second delays between requests

---

## Next Steps

1. ✅ Generate videos (estimated 5 minutes)
2. ✅ Review videos in `./nwsl_videos/` directory
3. ✅ Upload to X/Twitter (one per day recommended)
4. ✅ Monitor engagement and adjust messaging
5. ✅ Consider making more videos ($2,970 in credits remaining)

---

## Video Specs

- **Format:** MP4
- **Duration:** 8 seconds each
- **Resolution:** 4K (3840x2160)
- **Aspect Ratio:** 16:9 (optimized for X/Twitter)
- **Audio:** Yes (included)
- **Watermark:** @asphaltcowb0y (bottom right, white text with black outline)
- **File Size:** ~15MB per video

---

## Cost Tracking

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| Veo 3 videos (8s with audio) | 5 | $6.00 | $30.00 |
| **Remaining credits** | - | - | **$2,970** |

---

**Created:** 2025-11-06
**Purpose:** Generate cinematic videos exposing NWSL trans policy allowing biological males in women's soccer
**Watermark:** @asphaltcowb0y
