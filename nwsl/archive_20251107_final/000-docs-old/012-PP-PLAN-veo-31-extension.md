# Veo 3.1 Extension Implementation Plan
**Date:** 2025-11-06 22:35 UTC
**Goal:** Generate ONE continuous 30-second video using Veo 3.1 extension API

---

## Executive Summary

**What:** Use Veo 3.1's native video extension feature to create one seamless 30-second NWSL documentary trailer

**Why:** User wants "one freakign long video" - not separate clips merged together

**Cost:** ~$21.75 for 30-second continuous video (vs $24 for clip merging)

**Advantage:** True continuity with automatic visual and audio matching between segments

---

## Technical Approach

### Step 1: Generate Base Clip (8 seconds)

**Endpoint:**
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/pipelinepilot-prod/locations/us-central1/publishers/google/models/veo-3.1-generate:predictLongRunning
```

**Prompt for Act 1 (Base):**
```
4K photorealistic cinematic slow-motion. Professional women's soccer championship
final at golden hour. Female athletes in mid-celebration after scoring winning goal.
Pure joy, tears streaming, teammates embracing. Faces filled with emotion - the WHY
they play. Diverse team, powerful athletic builds, genuine human connection. Shot on
Arri Alexa, shallow depth of field isolates emotion. Documentary realism meets artistic
beauty. Warm golds, deep greens, emotional authenticity. This is women's sports at its
absolute finest. 8 seconds.
```

**Expected Output:**
- 8-second base video
- Storage URI: `gs://pipelinepilot-prod-veo-videos/base_celebration/`
- Operation ID for tracking

### Step 2: First Extension (7 seconds) - Total: 15s

**Endpoint:**
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/pipelinepilot-prod/locations/us-central1/publishers/google/models/veo-3.1-extend:predictLongRunning
```

**Extension Parameters:**
```json
{
  "sourceVideoUri": "gs://pipelinepilot-prod-veo-videos/base_celebration/sample_0.mp4",
  "prompt": "Camera slowly pulls back from the celebration. Transition to darker lighting. Reveal wider stadium context. Joy begins to fade as camera movement suggests something ominous approaching. Cinematic transition from warm to cool tones. 7 seconds.",
  "duration": 7
}
```

**Expected Output:**
- 15-second continuous video (8s base + 7s extension)
- Seamless visual and audio continuity
- Automatic tone transition from celebration to tension

### Step 3: Second Extension (7 seconds) - Total: 22s

**Extension Prompt:**
```
Film noir aesthetic takes over. Camera now on close-up of official NWSL policy
document on mahogany desk. Dramatic side lighting through venetian blinds creates
shadows. Document pages flutter slightly. Camera pushes in on text about testosterone
levels. Serious, ominous atmosphere. Professional office setting, investigative
journalism style. High contrast lighting. 7 seconds.
```

**Expected Output:**
- 22-second continuous video
- Natural transition from stadium to office setting
- Maintains documentary tone throughout

### Step 4: Third Extension (7 seconds) - Total: 29s

**Extension Prompt:**
```
Camera drift from policy document to empty women's locker room. Single soccer jersey
hanging alone in spotlight, others removed. Slow camera orbit around the isolated
jersey. Metaphor for being silenced. Dramatic lighting emphasizing solitude. Modern
locker room, cold and quiet. Emotional weight, contemplative mood. Shadows dominate.
7 seconds.
```

**Expected Output:**
- 29-second continuous video
- Emotional progression: Joy → Threat → Isolation
- Ready for final scene if needed

### Optional Step 5: Fourth Extension (7 seconds) - Total: 36s

**Extension Prompt:**
```
Aerial drone shot rises from locker room through stadium roof to high altitude view.
Empty professional women's soccer stadium at dusk. Golden hour lighting creates long
shadows across pristine grass. Complete silence, no players, no controversy, just
emptiness. Slow cinematic descent toward center field. Beautiful but melancholic.
Thought-provoking finale. 7 seconds.
```

**Expected Output:**
- 36-second prestige documentary trailer
- Complete emotional arc
- Ready for watermark and distribution

---

## API Research Needed

### Critical Questions

1. **What is the exact Veo 3.1 extension endpoint?**
   - Is it `veo-3.1-extend`?
   - Or is it `veo-3.1-generate-001:extend`?
   - Need to check Vertex AI docs

2. **How do we reference the source video?**
   - Full GCS URI? `gs://bucket/path/to/video.mp4`
   - Operation ID from previous generation?
   - Video URI from response object?

3. **What are the exact request parameters?**
   ```json
   {
     "sourceVideoUri": "?",
     "prompt": "continuation prompt",
     "duration": 7,
     "parameters": {
       "storageUri": "gs://bucket/output/",
       "aspectRatio": "16:9"
     }
   }
   ```

4. **Are extensions available in Vertex AI API?**
   - Docs mention "Google AI Studio and Vertex AI"
   - Need to confirm API endpoint exists
   - May need to use AI Studio instead

---

## Implementation Script

### Phase 1: Base Generation (Python)

```python
#!/usr/bin/env python3
"""
Generate base video with Veo 3.1, then extend to 30 seconds.
"""

import json
import time
from google.cloud import aiplatform
from google.auth import default
import requests

# Configuration
PROJECT_ID = "pipelinepilot-prod"
LOCATION = "us-central1"
BUCKET = f"gs://{PROJECT_ID}-veo-videos"

# Get credentials
credentials, _ = default()
credentials.refresh(requests.Request())
access_token = credentials.token

# Base generation endpoint
BASE_ENDPOINT = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"publishers/google/models/veo-3.1-generate-001:predictLongRunning"
)

# Extension endpoint (TO BE CONFIRMED)
EXTEND_ENDPOINT = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"publishers/google/models/veo-3.1-extend:predictLongRunning"
)

def generate_base_video(prompt: str) -> dict:
    """Generate 8-second base video."""
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "storageUri": f"{BUCKET}/nwsl_continuous_base/",
            "sampleCount": 1,
            "aspectRatio": "16:9"
        }
    }

    response = requests.post(
        BASE_ENDPOINT,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    return response.json()

def extend_video(source_uri: str, prompt: str, extension_num: int) -> dict:
    """Extend video by 7 seconds."""
    payload = {
        "sourceVideoUri": source_uri,
        "prompt": prompt,
        "duration": 7,
        "parameters": {
            "storageUri": f"{BUCKET}/nwsl_continuous_ext{extension_num}/",
            "aspectRatio": "16:9"
        }
    }

    response = requests.post(
        EXTEND_ENDPOINT,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    return response.json()

def wait_for_operation(operation_name: str, timeout: int = 300) -> str:
    """Wait for LRO to complete and return video URI."""
    # Poll operation status
    # Extract video URI from metadata
    # Return GCS path
    pass

def main():
    print("=" * 70)
    print("VEO 3.1 CONTINUOUS VIDEO GENERATION")
    print("=" * 70)
    print("Generating ONE continuous 30-second NWSL documentary trailer")
    print()

    # Step 1: Base generation
    print("STEP 1/4: Generating base 8-second clip...")
    base_prompt = """
    4K photorealistic cinematic slow-motion. Professional women's soccer championship
    final at golden hour. Female athletes in mid-celebration after scoring winning goal.
    Pure joy, tears streaming, teammates embracing. Documentary realism meets artistic
    beauty. This is women's sports at its finest. 8 seconds.
    """

    base_response = generate_base_video(base_prompt)
    base_operation = base_response['name']
    print(f"✓ {base_operation}")

    # Wait for base to complete
    print("\nWaiting 90 seconds for base generation...")
    time.sleep(90)
    base_video_uri = wait_for_operation(base_operation)
    print(f"✓ Base video: {base_video_uri}")

    # Step 2: First extension (15s total)
    print("\nSTEP 2/4: First extension (7s)...")
    ext1_prompt = """
    Camera slowly pulls back from celebration. Transition to darker lighting.
    Joy begins to fade as camera movement suggests something ominous approaching.
    Cinematic transition from warm to cool tones. 7 seconds.
    """

    ext1_response = extend_video(base_video_uri, ext1_prompt, 1)
    print(f"✓ {ext1_response['name']}")

    # Wait and continue...
    # (Full implementation continues)

if __name__ == "__main__":
    main()
```

---

## Cost Breakdown

### 30-Second Video
- Base generation: 8s × $0.75/s = **$6.00**
- Extension 1: 7s × $0.75/s = **$5.25**
- Extension 2: 7s × $0.75/s = **$5.25**
- Extension 3: 7s × $0.75/s = **$5.25**
- **Total: $21.75**

### 36-Second Video (with finale)
- Base + 3 extensions above = **$21.75**
- Extension 4: 7s × $0.75/s = **$5.25**
- **Total: $27.00**

### Budget Status
- Started with: **$3,000**
- Spent so far: **$36** (previous test clips)
- This video: **$21.75** (30s) or **$27.00** (36s)
- **Remaining after:** $2,942 or $2,937

---

## Quality Advantages

### vs Clip Merging
1. ✅ **No visible seams** - AI generates continuity automatically
2. ✅ **Audio continuity** - Seamless sound transitions
3. ✅ **Natural motion** - Camera movements flow naturally
4. ✅ **Tonal progression** - Automatic lighting/mood transitions
5. ✅ **Single render** - One cohesive video file

### vs Manual Stitching
- No FFmpeg complexity
- No color grading mismatches
- No audio cuts
- No transition effects needed

---

## Risk Assessment

### Technical Risks
1. **API Availability** - Veo 3.1 extension may not be in Vertex AI yet
   - **Mitigation:** Check AI Studio, use web interface if needed

2. **Quality Degradation** - Extensions may not match base quality
   - **Mitigation:** Test with one extension first, evaluate

3. **Prompt Adherence** - Extension may not follow continuation prompt
   - **Mitigation:** Use strong visual cues, test iteratively

### Cost Risks
1. **Failed Extensions** - May need multiple attempts
   - **Budget:** Plan for $50 total (includes retries)

2. **Resolution Limits** - Extensions limited to 720p
   - **Acceptable:** 720p still HD quality for social media

---

## Success Criteria

### Must Have ✅
- [ ] Seamless visual continuity (no visible cuts)
- [ ] Audio continuity maintained
- [ ] Emotional arc flows naturally (joy → tension → isolation)
- [ ] Total duration 29-36 seconds
- [ ] Quality suitable for X/Twitter

### Nice to Have
- [ ] 1080p resolution (may be limited to 720p)
- [ ] Perfect prompt adherence
- [ ] Single-take feel

---

## Next Steps

### Immediate Actions (Next 30 minutes)
1. ✅ Research complete (this document)
2. ⏳ Check Vertex AI docs for Veo 3.1 extension API
3. ⏳ Test extension endpoint with dummy request
4. ⏳ Generate base 8-second clip
5. ⏳ Test one 7-second extension
6. ⏳ Evaluate quality before proceeding

### If Extension API Not Available
**Fallback:** Use existing 3 clean clips (scene1, scene2, scene4)
- Merge with Cloud Run service
- Add Lyria score
- Deliver 24-second video
- Wait for Veo 3.1 extension API access

---

## Decision Point

**User needs to choose:**

### Option A: Wait for Veo 3.1 Extension Research
- Research API endpoints (30 mins)
- Test extension capability
- Then generate 30s continuous video
- **Timeline:** 1-2 hours to completion
- **Cost:** $21.75

### Option B: Use Existing Clips Now
- Merge scene1 + scene2 + scene4 (5 mins)
- Add Lyria score ($0.12)
- Deliver 24s video immediately
- Research Veo 3.1 for NEXT video
- **Timeline:** 10 minutes to completion
- **Cost:** $0.12

### Option C: Try Runway Gen-3 Turbo
- Set up Runway account (15 mins)
- Test 30s generation
- Much cheaper ($1.50 vs $21.75)
- **Timeline:** 1 hour to completion
- **Cost:** $1.50

---

**Recommendation:** Option A - Research Veo 3.1 extension, then generate ONE truly continuous 30-second video with native Vertex AI integration.

---

**Last Updated:** 2025-11-06 22:35 UTC
**Status:** Plan complete, awaiting API research and user approval
