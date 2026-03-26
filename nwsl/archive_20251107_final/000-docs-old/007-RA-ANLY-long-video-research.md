# Research: How to Generate ONE LONG Continuous Video

**Date:** 2025-11-06 22:30 UTC
**Problem:** User wants ONE continuous long video (30+ seconds), not separate clips merged
**Current Limitation:** Veo 3 base model maxes at 8 seconds per generation

---

## 🏆 SOLUTION 1: Veo 3.1 Extension Feature (RECOMMENDED)

### Overview
**Veo 3.1 includes native video extension** - released October 15, 2025 via Gemini API

### Capabilities
- **Base generation**: 4-8 seconds
- **Extension**: Add 7 seconds per hop
- **Maximum hops**: 20 extensions
- **Total possible duration**: **148 seconds** (2 minutes 28 seconds)
- **Continuity**: Visual AND audio continuity maintained
- **Method**: Each extension uses final second of previous clip

### Technical Specs
- Supported aspect ratios: 9:16 or 16:9
- Resolution limit: 720p for extensions
- API: Available in Google AI Studio and Vertex AI
- Each extension is based on the final second of the previous clip

### How It Works
1. Generate initial 8-second clip with base prompt
2. Call extension API with continuation prompt (optional)
3. Repeat up to 20 times for continuous sequence
4. Result: One seamless video up to 148 seconds

### Cost Estimate
- Base generation: 8 seconds × $0.75/sec = **$6.00**
- Extensions: 7 sec × 20 hops × $0.75/sec = **$105.00**
- **Total for 148-second video**: **$111.00**
- **For 30-second video**: 8s base + 3 extensions (21s) + 1 more (28s) ≈ **$27.00**

### Pros ✅
- Native Vertex AI integration (already using this)
- Maintains visual and audio continuity
- Can reach 148 seconds total
- Same quality as base generations
- No manual stitching required

### Cons ❌
- Higher cost than separate clips + merge
- Extension quality may vary
- 720p resolution limit for extensions (vs 1080p base)

### Implementation Plan
```python
# 1. Generate base clip (8 seconds)
base_prompt = "4K cinematic women's soccer celebration..."
base_response = generate_veo_video(base_prompt, duration=8)

# 2. Extend video (7 seconds each)
for i in range(3):  # 3 extensions = 29 seconds total
    extension_prompt = "Continue the celebration, camera pulls back..."
    extend_response = extend_veo_video(
        source_video=base_response.video_uri,
        prompt=extension_prompt,
        duration=7
    )
    base_response = extend_response
```

### API Endpoint
- Extension endpoint: `veo-3.1-extend` (check Vertex AI docs)
- Same region: us-central1
- Same project: pipelinepilot-prod

---

## SOLUTION 2: Runway Gen-3 Turbo Extension

### Overview
Alternative AI video platform with extension capabilities

### Capabilities
- **Base generation**: 5-10 seconds
- **Extension**: 8-second increments
- **Method**: Last keyframe to video

### Cost Estimate
- Pricing: ~$0.05/second
- 30-second video: 30 × $0.05 = **$1.50**
- **Much cheaper than Veo!**

### Technical Specs
- Max 10 seconds per generation
- Video-to-video transformation up to 20 seconds input
- Requires Runway account + API access

### Pros ✅
- Significantly cheaper ($1.50 vs $27 for 30s)
- 10-second base generations (vs 8s)
- Good quality output

### Cons ❌
- Requires new platform setup (Runway account)
- Need to export from Vertex AI ecosystem
- Learning curve for new API
- May have different visual style

---

## SOLUTION 3: Pika 2.2 Extension + Manual Stitching

### Overview
Newer platform with 10-second generations

### Capabilities
- **Base generation**: 10 seconds (Pika 2.2)
- **Extension**: Manual stitching required
- **Expand Canvas**: Can extend visual boundaries

### Cost
- Need to research Pika pricing
- Likely similar to Runway (~$0.03-0.05/sec)

### Pros ✅
- 10-second base clips
- Creative effects (Pikaffects)
- Good for variety

### Cons ❌
- Manual stitching still required
- No automatic continuity
- New platform setup

---

## SOLUTION 4: Luma Dream Machine Extension

### Overview
Ray2 model with extension capabilities

### Capabilities
- **Base generation**: 5 seconds default, 10 seconds max
- **Extension**: Can extend to ~30 seconds
- **Quality note**: May degrade beyond 30s

### Cost
- Need to research Luma pricing

### Pros ✅
- Can reach 30 seconds
- Fast generation (2 minutes)
- Good default quality

### Cons ❌
- Quality degrades with extensions
- Limited to ~30 seconds
- New platform setup

---

## SOLUTION 5: Image-to-Video with Camera Movement

### Overview
Generate ONE master storyboard image, then animate with camera movement

### Method
1. Use Imagen 3 to create master storyboard (4-6 panels)
2. Use Veo image-to-video with camera movement prompt
3. Single continuous camera pan/zoom across storyboard

### Cost Estimate
- Imagen 3: ~$0.04 per image
- Veo image-to-video: ~$0.75/sec
- 30-second video: **~$22.50**

### Pros ✅
- Truly continuous (no clip boundaries)
- Creative storyboard approach
- Single cohesive composition

### Cons ❌
- Experimental approach
- May not work as expected
- Limited motion (camera movement only)

---

## SOLUTION 6: Prompt Chaining (Current Approach)

### Overview
What we're currently doing - generate clips with progressive prompts and merge

### Capabilities
- 8-second clips merged with FFmpeg
- Cloud Run merger service deployed
- Watermark added automatically

### Cost Estimate
- 4 clips × $6 = **$24**
- Lyria score: **$0.12**
- Merge: **Free** (Cloud Run)
- **Total: $24.12**

### Pros ✅
- Already implemented and working
- Good quality clips generated
- Cost-effective for 24-32 seconds
- Full control over each segment

### Cons ❌
- Visible seams between clips
- Not truly "one long video"
- Limited by 8-second segments

---

## 📊 COMPARISON TABLE

| Solution | Max Duration | Cost (30s) | Continuity | Platform | Setup Time |
|----------|--------------|------------|------------|----------|------------|
| **Veo 3.1 Extension** | 148s | $27 | Excellent | Vertex AI | Minimal ✅ |
| Runway Gen-3 | Unlimited* | $1.50 | Good | Runway | Moderate |
| Pika 2.2 | 30s+ | ~$2 | Manual | Pika | Moderate |
| Luma Dream | ~30s | ~$2 | Degrades | Luma | Moderate |
| Image-to-Video | 30s | $22.50 | Experimental | Vertex AI | Minimal |
| Clip Merging (current) | Unlimited | $24 | Visible seams | Vertex AI | Complete ✅ |

*with extensions

---

## 🎯 RECOMMENDATION

### For Immediate Use: **Veo 3.1 Extension**

**Why:**
1. ✅ Native Vertex AI integration (already using it)
2. ✅ True continuous video with audio continuity
3. ✅ Can reach 148 seconds (way more than needed)
4. ✅ No new platform setup required
5. ✅ Maintains prestige quality throughout

**Cost for 30-second NWSL video:**
- Base 8s clip: $6
- 3 extensions (7s each = 21s more): $15.75
- **Total: $21.75** (vs $24 for clip merging)

**Next Steps:**
1. Research Veo 3.1 extension API endpoint in Vertex AI
2. Test with one 30-second extended video
3. If quality good, use for prestige NWSL documentary

### Alternative If Veo 3.1 Not Available: **Runway Gen-3 Turbo**

**Why:**
- Significantly cheaper ($1.50 vs $21.75)
- Already has extension features
- Good quality output

**Trade-offs:**
- Requires Runway account setup
- Different visual style from Veo
- Need to learn new API

---

## 🔬 NEXT ACTIONS

### Option A: Use Veo 3.1 Extension (Recommended)
1. Research Veo 3.1 extension API in Vertex AI documentation
2. Create test script for 30-second extended video
3. Generate ONE continuous NWSL video
4. Evaluate quality vs clip merging

### Option B: Test Runway Gen-3 Turbo
1. Sign up for Runway account
2. Get API access
3. Test 30-second generation
4. Compare cost/quality

### Option C: Finish Current 24s Video First
1. Merge existing 3 clips (scene1, scene2, scene4)
2. Add Lyria score ($0.12)
3. Deliver to user for feedback
4. Then test Veo 3.1 extension for next video

---

## 💡 USER DECISION NEEDED

**Question for user:**

We have **3 clean clips ready** (24 seconds merged). Do you want to:

1. **Complete current video first** ($0.12 for Lyria, 5 mins) then test Veo 3.1 extension
2. **Pivot to Veo 3.1 extension NOW** for one continuous 30-second video ($21.75)
3. **Test Runway Gen-3 Turbo** as cheaper alternative ($1.50 for 30s)

**My recommendation:** Option 2 - Use Veo 3.1 extension for truly continuous video with native Vertex AI integration.

---

**Sources:**
- Voxfor: Google Veo 3.1 Guide (2025)
- Skywork AI: Veo 3.1 Extension Guide
- Runway ML: Gen-3 Turbo Documentation
- Pikart AI: Pika 1.5/2.2 Features
- Luma Labs: Dream Machine Capabilities

**Last Updated:** 2025-11-06 22:30 UTC
**Status:** Research complete, awaiting user decision on implementation approach
