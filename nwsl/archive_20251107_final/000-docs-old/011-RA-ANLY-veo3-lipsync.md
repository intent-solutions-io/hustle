# Veo 3 Lip-Sync Research & Production Plan
**Date:** 2025-11-06 23:00 UTC
**Discovery:** Veo 3 has NATIVE lip-sync capability for talking head videos

---

## Executive Summary

**BREAKTHROUGH:** Veo 3 can generate talking head videos with automatic lip-sync, eliminating the need for Wav2Lip, SadTalker, D-ID, or HeyGen.

**Source:** Multiple 2025 sources confirm Veo 3 "natively produces dialogue, ambient sound, and effects in sync with the visuals, including lip-sync for talking characters."

**Implication:** We CAN execute the full 90-second NWSL script with voiceover and lip-sync for **$67.50**.

---

## What Veo 3 Can Do

### From Google's Documentation & Research

> "Veo 3 natively produces dialogue, ambient sound, and effects in sync with the visuals, including lip-sync for talking characters."

> "When you create a video with Veo 3, it automatically generates contextual audio - from dialogue with lip-sync for talking characters to ambient sounds, music, and sound effects - all synchronized perfectly with the visuals."

### Key Capabilities

1. **Generate AI Avatar** - Creates photorealistic person
2. **Generate Voice** - Synthesizes speech matching prompt
3. **Auto Lip-Sync** - Synchronizes mouth movements to audio
4. **Contextual Sound** - Adds ambient audio, music, effects
5. **4K Quality** - High-resolution output

### Best Practice

> "The most reliable approach for tight lip‑sync is one speaker per short clip"

**Recommendation:** Generate 6 separate scenes (15-20 seconds each) rather than one 90-second continuous shot.

---

## Vertex AI API Support

### Confirmed Features (from docs)

**Dialogue in Prompts:**
```
"The man in the red hat says, 'Where is the rabbit?' Then the woman
in the green dress next to him replies, 'There, in the woods.'"
```

**Available Model:** `veo-3.0-generate-001` (what we're already using!)

### Unknown/Untested

- ❓ Lip-sync quality in Vertex AI vs AI Studio
- ❓ Maximum dialogue length per clip
- ❓ Voice quality and consistency
- ❓ Can we specify voice characteristics?

---

## Production Plan: 90-Second NWSL Documentary

### Scene Breakdown

**Scene 1: Opening (15s) - $11.25**
```
Veo 3 Prompt:
"4K cinematic documentary interview. Professional female soccer player,
early 30s, athletic build, in NWSL jersey sitting in modern locker room.
Natural window lighting. She looks directly at camera with confidence and
says warmly: 'Eleven years ago, I stepped onto this field with a dream
that felt impossible.' Slow push-in on her face. Genuine emotion in eyes.
Documentary realism style. 15 seconds."
```

**Scene 2: The Struggle (15s) - $11.25**
```
Same female athlete, more passionate tone, gesturing slightly as she speaks:
'Women fought for decades—not just for the right to play—but for the right
to be seen. To be valued. To have our own space where we could compete, grow,
and inspire the next generation.' Camera holds steady. Natural expressions.
15 seconds.
```

**Scene 3: The Achievement (15s) - $11.25**
```
Female athlete speaking with pride, slight smile: 'Today, the NWSL isn't just
a league. It's proof. Proof that when women have space to compete on a level
playing field, we don't just participate—we dominate. We break records. We
fill stadiums. We change the world.' Cut to B-roll: stadium crowd celebrating.
15 seconds.
```

**Scene 4: The Tension (20s) - $15.00**
```
Female athlete's tone becomes serious, contemplative: 'But here's the truth
we can't ignore: this space was created for a reason. Biological differences
in sports aren't opinions—they're physiology. Testosterone levels, muscle
mass, bone density… these aren't talking points. They're the science that
makes competition fair.' Pause. 'And fairness? That's not hateful. It's
foundational.' 20 seconds.
```

**Scene 5: The Call (15s) - $11.25**
```
Female athlete speaking with conviction, leaning forward: 'I love this league.
I love what it represents. And that's exactly why we need to have hard
conversations—not to exclude anyone, but to protect what generations of women
built. We can honor inclusion AND protect competitive integrity. These aren't
opposing forces. They're both essential.' 15 seconds.
```

**Scene 6: The Close (10s) - $7.50**
```
Female athlete final statement, direct eye contact: 'Because the 'W' in NWSL?
It stands for something.' Pause. 'And it's worth fighting for.' Fade to black.
Text overlay: '@asphaltcowb0y'. 10 seconds.
```

**Total Cost: $67.50**

---

## Alternative Approach: Veo 3.1 Extension

### Continuous 90-Second Shot

**Base Generation (15s):** $11.25
- Opening statement with full camera setup

**Extension 1 (15s):** $11.25
- Continue speaking, natural transition to second point

**Extension 2 (15s):** $11.25
- Achievement statements, background shifts to stadium B-roll

**Extension 3 (20s):** $15.00
- Serious tone shift, discussion of science and fairness

**Extension 4 (15s):** $11.25
- Passionate call to action

**Extension 5 (10s):** $7.50
- Final statement and fade

**Total: $67.50** (same cost, but truly continuous)

---

## Open-Source Alternatives (If Veo 3 Fails)

### Option 1: SadTalker (Free, Self-Hosted)

**What it is:**
- Open-source AI for creating talking head videos from single image + audio
- Perfect lip-sync
- Can deploy on GCP (Compute Engine or Cloud Run)

**Workflow:**
1. Generate still image of athlete with Imagen 3 ($0.04)
2. Record voiceover (use Lyria or external service)
3. Run SadTalker to animate image with audio
4. Deploy on GCP for processing

**Cost:**
- Imagen 3 image: $0.04
- Lyria voiceover (90s): $0.18
- GCP compute (Compute Engine with GPU): ~$1-2/hour
- **Total: ~$2-5 for 90-second video**

**Deployment:**
```bash
# Deploy SadTalker on GCP Compute Engine
gcloud compute instances create sadtalker-gpu \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release

# SSH and install
gcloud compute ssh sadtalker-gpu --zone=us-central1-a
git clone https://github.com/OpenTalker/SadTalker
# ... setup steps
```

### Option 2: Wav2Lip (Free, Self-Hosted)

**What it is:**
- Lip-sync any video to any audio
- Less realistic than SadTalker but faster

**Workflow:**
1. Generate base video with Veo 3 (no dialogue)
2. Record voiceover separately
3. Use Wav2Lip to sync lips to audio

**Cost:**
- Veo 3 video (no dialogue): $67.50
- Lyria voiceover: $0.18
- GCP compute: ~$1/hour
- **Total: ~$69**

### Option 3: HeyGenClone (Open Source)

**What it is:**
- Open-source analogue of HeyGen
- Docker-based deployment
- Can run on GCP

**Cost:** Similar to SadTalker (~$2-5)

---

## TEST PLAN: Validate Veo 3 Lip-Sync

### Phase 1: Single Scene Test (5 minutes)

**Generate 10-second test clip with dialogue:**

```python
{
  "instances": [{
    "prompt": "4K cinematic. Female athlete in soccer jersey sitting in
    locker room says to camera: 'The NWSL was built by women, for women,
    and that matters.' Natural lighting, documentary style. 10 seconds with
    perfect lip sync."
  }],
  "parameters": {
    "storageUri": "gs://pipelinepilot-prod-veo-videos/lipsync_test/",
    "sampleCount": 1
  }
}
```

**Cost:** 10s × $0.75/s = **$7.50**

**Success Criteria:**
- ✅ Lip movements match audio
- ✅ Voice sounds natural
- ✅ Audio quality is clear
- ✅ No visual artifacts

**If Test Passes:** Proceed with full 90-second production

**If Test Fails:** Pivot to SadTalker or Wav2Lip

---

## Deployment Options

### Option A: Veo 3 Native (Recommended)

**Pros:**
- ✅ No additional setup required
- ✅ Already have Vertex AI access
- ✅ High quality 4K output
- ✅ Automatic lip-sync

**Cons:**
- ❌ Higher cost ($67.50)
- ❌ Limited control over voice
- ❌ May have quality variations

### Option B: SadTalker Self-Hosted

**Pros:**
- ✅ Much cheaper ($2-5)
- ✅ Full control over voiceover
- ✅ Proven technology
- ✅ Can regenerate voice without re-rendering video

**Cons:**
- ❌ Requires GCP Compute Engine setup (2 hours)
- ❌ GPU instance costs
- ❌ Less photorealistic than Veo 3
- ❌ More complex workflow

### Option C: Hybrid Approach

**Workflow:**
1. Generate B-roll with Veo 3 (stadiums, celebrations, empty locker)
2. Generate athlete portrait with Imagen 3
3. Use SadTalker for talking head
4. Merge all footage with FFmpeg

**Pros:**
- ✅ Best of both worlds
- ✅ High-quality B-roll + controlled voiceover
- ✅ Cost-effective

**Cons:**
- ❌ Most complex workflow
- ❌ Requires editing skills

---

## RECOMMENDATION

### Immediate Action: TEST Veo 3 Lip-Sync

1. **Generate 10-second test clip** with dialogue ($7.50)
2. **Evaluate quality** of lip-sync, voice, and overall realism
3. **Decision point**:
   - If good → Proceed with full 90-second Veo 3 production ($67.50)
   - If poor → Pivot to SadTalker deployment ($2-5)

### Timeline

**If Veo 3 Works:**
- Test generation: 5 minutes
- Full production: 2 hours (6 scenes × 20 mins each)
- **Total: 2.5 hours**

**If SadTalker Needed:**
- GCP setup: 2 hours
- Image generation: 5 minutes
- Voiceover creation: 30 minutes
- SadTalker processing: 30 minutes
- **Total: 3.5 hours**

---

## Budget Summary

### Option Comparison

| Approach | Cost | Timeline | Quality | Complexity |
|----------|------|----------|---------|------------|
| **Veo 3 Native** | $67.50 | 2.5 hrs | High (4K) | Low ✅ |
| **SadTalker** | $2-5 | 3.5 hrs | Medium | High |
| **Wav2Lip** | $69 | 3 hrs | Medium | Medium |
| **Hybrid** | $35 | 4 hrs | High | High |

### Budget Status

- Started with: **$3,000**
- Spent so far: **$36** (test clips)
- Test clip: **$7.50**
- Full production: **$67.50** (Veo 3) OR **$2-5** (SadTalker)
- **Remaining after:** $2,889 (Veo 3) OR $2,950 (SadTalker)

---

## Next Steps

### 1. User Decision

Choose approach:
- **A)** Test Veo 3 lip-sync NOW ($7.50 test, then $67.50 if good)
- **B)** Skip test, deploy SadTalker ($2-5 total)
- **C)** Hybrid approach ($35 total)

### 2. If Veo 3 Test Approved

```bash
# Generate test clip
cd /home/jeremy/000-projects/iams/pipelinepilot
python scripts/test_veo3_lipsync.py
```

### 3. If SadTalker Chosen

```bash
# Deploy GCP instance
./scripts/deploy_sadtalker_gpu.sh

# Generate video
python scripts/generate_with_sadtalker.py \
  --image athlete_portrait.jpg \
  --audio voiceover.mp3 \
  --output nwsl_final.mp4
```

---

## Critical Questions to Answer

1. **Does Veo 3 lip-sync work in Vertex AI API?**
   - Test with 10-second clip
   - Evaluate quality

2. **Can we control voice characteristics?**
   - Age, tone, accent?
   - Or is it random?

3. **Is dialogue length limited?**
   - 20-second monologue OK?
   - Or break into shorter segments?

4. **Is SadTalker deployment worth the complexity?**
   - Saves $62.50
   - Adds 1 hour setup time

---

**RECOMMENDATION:** Test Veo 3 first. If it works, use it (simplest path). If not, deploy SadTalker (cheaper but more complex).

---

**Last Updated:** 2025-11-06 23:00 UTC
**Status:** Research complete, awaiting test approval
