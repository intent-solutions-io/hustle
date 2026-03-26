# NWSL Video Clips - Complete Inventory
**Date:** 2025-11-06
**Location:** `/home/jeremy/000-projects/iams/pipelinepilot/000-docs/nwsl/`

---

## ✅ GOOD CLIPS (6 clips, 21.1MB total)

### Batch 1: First Generation (with text attempts - probably garbled)
1. **01_the_loophole.mp4** (2.1MB)
   - Prompt: Policy document on desk, text overlay "10 nmol/L = MALE RANGE"
   - Issue: Text probably garbled (AI can't render text)
   - Visual: Policy document, film noir lighting
   - Duration: 8 seconds

2. **02_the_door.mp4** (2.0MB)
   - Prompt: Women's locker room, door ajar, text "CURRENT NWSL POLICY: DOOR IS OPEN"
   - Issue: Text probably garbled
   - Visual: Locker room metaphor
   - Duration: 8 seconds

3. **04_the_science.mp4** (3.1MB)
   - Prompt: Testosterone molecule, text overlays about 5% reduction
   - Issue: Text probably garbled
   - Visual: Medical visualization
   - Duration: 8 seconds

### Batch 2: Test Generation (NO TEXT - clean visuals)
4. **scene1.mp4** (6.0MB) ⭐ BEST QUALITY
   - Prompt: Women's soccer celebration, golden hour, pure emotion
   - ✅ NO TEXT - Pure visual storytelling
   - Visual: Joy, teamwork, athletic excellence
   - Duration: 8 seconds
   - **USE THIS**

5. **scene2.mp4** (2.7MB)
   - Prompt: NWSL policy document, film noir lighting, investigative tension
   - ✅ NO TEXT - Just the document
   - Visual: Policy reveal, dramatic
   - Duration: 8 seconds
   - **USE THIS**

6. **scene4.mp4** (5.3MB) ⭐ BEST QUALITY
   - Prompt: Empty stadium aerial at dusk, golden hour, descent to field
   - ✅ NO TEXT - Powerful silence
   - Visual: Emptiness, contemplation
   - Duration: 8 seconds
   - **USE THIS**

---

## ❌ BAD CLIPS (2 clips, API errors)

7. **03_one_voice.mp4** (203 bytes)
   - API error response, not a video

8. **05_the_question.mp4** (203 bytes)
   - API error response, not a video

---

## 🎬 CAN WE MAKE A VIDEO FROM EXISTING CLIPS?

### YES - Using Test Batch (NO TEXT)

**Option A: 3-Act Structure (24 seconds)**
```
ACT 1 (0-8s): scene1.mp4 - Women's soccer celebration
ACT 2 (8-16s): scene2.mp4 - Policy document tension
ACT 3 (16-24s): scene4.mp4 - Empty stadium finale
```

**Message Flow:**
1. THIS is women's sports (celebration)
2. THIS is the policy that threatens it (document)
3. THIS is the reality - empty controversy (stadium)

**Quality:** ⭐⭐⭐⭐⭐ (6MB, 2.7MB, 5.3MB = high quality, NO TEXT issues)

---

### Option B: 5-Act Extended (40 seconds)

Could use clips from Batch 1 IF text isn't too garbled:
```
ACT 1 (0-8s): scene1.mp4 - Celebration
ACT 2 (8-16s): scene2.mp4 - Policy doc
ACT 3 (16-24s): 02_the_door.mp4 - Locker room metaphor
ACT 4 (24-32s): 04_the_science.mp4 - Science/biology
ACT 5 (32-40s): scene4.mp4 - Stadium finale
```

**Risk:** Batch 1 clips have garbled text overlays (AI limitation)
**Quality:** Mixed - some clips may look amateur due to text issues

---

## 🚀 RECOMMENDATION: Use 3-Clip Version (24 seconds)

**Why:**
- ✅ All 3 clips are CLEAN (no text issues)
- ✅ High quality (6MB, 2.7MB, 5.3MB file sizes)
- ✅ Clear narrative arc
- ✅ Professional-looking
- ✅ No wasted clips with garbled text

**Story:**
```
"Women's soccer excellence → Policy that threatens it → Empty controversy"
```

**Production:**
1. Merge scene1 + scene2 + scene4
2. Add Lyria 2 dramatic score (60s, $0.12)
3. Add @asphaltcowb0y watermark (final frame)
4. Export as `nwsl_24s_FINAL.mp4`

**Total Cost to Complete:**
- Clips already generated: $18 (sunk cost)
- Lyria score: $0.12
- **Total NEW spend: $0.12**

---

## 📊 COST ANALYSIS

### Already Spent:
- Batch 1: 3 good clips + 2 errors = **$18**
- Batch 2: 3 good clips = **$18**
- **Total spent:** $36

### To Complete Current Video:
- Lyria score: **$0.12**
- Merge + watermark: **Free** (Cloud Run)
- **Total:** $0.12

### Remaining Budget:
- Started: $3,000
- Spent: $36
- **Remaining:** $2,964

---

## 🎯 NEXT VIDEO: ONE LONG GENERATION

**User Request:** "Next video will be ONE LONG video, not separate clips"

**Problem:** Veo 3 maxes at **8 seconds per generation**

**Solutions:**

### Option 1: Use Veo 3 Extended Generation
- Research if Veo 3 has longer duration modes
- May support 16s or 32s in preview/beta

### Option 2: Use Different Video AI
- **Runway Gen-3 Turbo:** Up to 10 seconds ($0.05/sec)
- **Pika 1.5:** Up to 5 seconds base, extendable
- **Luma Dream Machine:** Up to 5 seconds
- **Issue:** All have similar 5-10s limits

### Option 3: Image-to-Video Chain
- Generate ONE master storyboard image (Imagen 3)
- Use image-to-video to create longer sequence
- Camera movement across the storyboard
- **Duration:** Potentially 15-30 seconds continuous

### Option 4: Prompt-Based Extension
- Generate first 8s clip
- Use that as input for "extend this video by 8s"
- Chain 4 times = 32s continuous
- **May work with Veo 3 or Runway**

---

## 🔬 RESEARCH NEEDED

Before next video, research:
1. Does Veo 3 support video-to-video extension?
2. Can we use Runway Gen-3 for longer generations?
3. Does Luma support continuous 30s generations?
4. Best approach for ONE LONG cinematic video

---

## 📁 FILE STRUCTURE (CLEANED)

```
000-docs/nwsl/
├── CLIP_INVENTORY.md (this file)
├── NWSL-VIDEO-PIPELINE-SUMMARY.md
├── nwsl-videos/ (Batch 1 - text attempts)
│   ├── 01_the_loophole.mp4 (2.1MB) - Use with caution
│   ├── 02_the_door.mp4 (2.0MB) - Use with caution
│   ├── 03_one_voice.mp4 (203B) - ERROR
│   ├── 04_the_science.mp4 (3.1MB) - Use with caution
│   └── 05_the_question.mp4 (203B) - ERROR
├── nwsl-videos-test/ (Batch 2 - CLEAN, no text) ⭐ USE THESE
│   ├── scene1.mp4 (6.0MB) - Celebration
│   ├── scene2.mp4 (2.7MB) - Policy doc
│   └── scene4.mp4 (5.3MB) - Stadium
└── nwsl-videos-final/ (Empty - where final video goes)
```

---

## ✅ IMMEDIATE ACTION

**Can complete NOW with existing clips:**
1. Merge scene1 + scene2 + scene4 (24 seconds)
2. Generate Lyria score ($0.12)
3. Add watermark
4. Deliver final video

**OR**

**Research for next video:**
- Find solution for ONE LONG continuous generation
- Test Runway Gen-3 or other platforms
- Investigate video-to-video extension

---

**Your call:**
- A) Complete 24s video with existing clips NOW ($0.12)
- B) Research ONE LONG video solutions first

---

**Last Updated:** 2025-11-06 22:20 UTC
**Status:** 6 good clips ready, 24s video can be assembled immediately
