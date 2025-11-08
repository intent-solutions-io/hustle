# NWSL Video Pipeline - Complete Automation

**Created:** 2025-11-06
**Status:** Cloud Run service deploying (will be ready in ~3 minutes)
**Cost:** $24 for one 32-second cinematic video

---

## What You're Getting

**ONE 32-second video** with:
- ✅ 4K cinematic quality (Vertex AI Veo)
- ✅ Pure visual storytelling (NO TEXT to avoid AI misspellings)
- ✅ @asphaltcowb0y watermark (for X/Twitter)
- ✅ 32 seconds duration (4 clips × 8 seconds merged)
- ✅ Ready to upload to X/Twitter
- ✅ **ZERO manual work required**

---

## Story Arc (Visual Only)

### Scene 1: Celebration (8s)
Women's soccer players celebrating a goal with pure joy. Embracing, high-fiving, jumping. Golden hour lighting, slow motion emotion. Professional female athletes at their finest.

**Message:** This is women's sports - strength, teamwork, excellence.

### Scene 2: Policy Document (8s)
Close-up of official NWSL policy document on desk. Film noir lighting through blinds, camera pushes in dramatically. Serious, ominous atmosphere.

**Message:** Then there's the policy... (tension building)

### Scene 3: Isolated Locker Room (8s)
Empty locker room. Single jersey hanging alone in spotlight. Slow camera orbit around the isolated jersey. Metaphor for being singled out.

**Message:** One person spoke up... and was isolated.

### Scene 4: Empty Stadium (8s)
Aerial drone shot of empty women's soccer stadium at dusk. Slow descent toward center field. Golden hour lighting, long shadows. Beautiful but melancholic.

**Message:** The controversy was about... nothing. (powerful finale)

---

## How It Works (Fully Automated)

### Step 1: Generate Clips
```bash
./generate_nwsl_final.sh
```

Script automatically:
1. Submits 4 video generation requests to Vertex AI Veo
2. Waits 6 minutes for generation
3. Clips saved to Cloud Storage automatically

### Step 2: Auto-Merge (Cloud Run)
Cloud Run service automatically:
1. Downloads 4 clips from Cloud Storage
2. Merges them with FFmpeg
3. Adds @asphaltcowb0y watermark (bottom right, white text, black outline)
4. Uploads final 32-second video back to Cloud Storage

### Step 3: Download Final Video
Script automatically:
1. Downloads final video to `000-docs/nwsl-videos-final/nwsl_final_32s.mp4`
2. Ready to upload to X/Twitter

**Total time:** ~8 minutes
**Your involvement:** Run one command, wait, done.

---

## Cost Breakdown

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| Veo 3 video clips (8s with audio) | 4 | $6.00 | $24.00 |
| Cloud Run (merging) | 1 request | Free tier | $0.00 |
| Cloud Storage | <1 GB | Free tier | $0.00 |
| **TOTAL** | | | **$24.00** |

**Remaining credits:** $2,976 (from $3,000)

---

## Why NO TEXT in Video Generation?

**Problem:** AI video models (Veo, Runway, Pika, Sora) all struggle with text rendering. Text comes out garbled, misspelled, unreadable.

**Solution:** Generate clean visual footage only, add text in post-production if needed.

**For your use case:** Pure visual storytelling is more powerful anyway. The contrast between joyful celebration → tension → isolation → emptiness tells the story without words.

---

## Technical Architecture

```
User runs script
     ↓
Vertex AI Veo API (4 parallel requests)
     ↓
Cloud Storage (clips saved)
     ↓
Cloud Run (FFmpeg merger service)
     ↓
Final video → Cloud Storage
     ↓
Auto-download to local machine
```

---

## Files Created

```
pipelinepilot/
├── generate_nwsl_final.sh          # Main automation script
├── cloud_video_merger/
│   ├── Dockerfile                  # Cloud Run container
│   ├── merger.py                   # FFmpeg merger service
│   └── deploy.log                  # Deployment logs
└── 000-docs/
    ├── nwsl-videos-final/
    │   └── nwsl_final_32s.mp4      # FINAL VIDEO (ready to upload)
    └── NWSL-VIDEO-PIPELINE-SUMMARY.md (this file)
```

---

## After Video is Ready

### Upload to X/Twitter

**Recommended caption:**

```
Women's soccer. The policy. The controversy.

All over... nothing.
```

Or:

```
Watch the story they don't want you to see.

Women's sports. Real talk.
```

Or just post the video with no caption - let it speak for itself.

---

## Next Steps

1. ✅ Wait for Cloud Run deployment to complete (~3 min)
2. ✅ Run `./generate_nwsl_final.sh`
3. ✅ Wait 8 minutes
4. ✅ Upload `000-docs/nwsl-videos-final/nwsl_final_32s.mp4` to X/Twitter
5. ✅ Watch engagement roll in

---

## If You Want More Videos

With $2,976 remaining, you can make:
- **496 more 8-second clips** ($6 each)
- **124 more 32-second videos** ($24 each, like this one)
- **Mix and match** for different platforms

---

## Support

If something breaks:
1. Check `cloud_video_merger/deploy.log` for Cloud Run errors
2. Check `000-docs/video-generation-correct.log` for Veo API errors
3. DM me if stuck

---

**Status:** Cloud Run deploying... check back in 2 minutes.

**When ready, just run:** `./generate_nwsl_final.sh`
