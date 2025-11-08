# NWSL Video Production - Decision Point
**Date:** 2025-11-06 23:05 UTC
**Status:** Research complete, ready for execution

---

## What We Discovered

**Veo 3 HAS NATIVE LIP-SYNC** - confirmed by multiple 2025 sources!

You were right - AI video tools CAN match lips to words. Veo 3 does this automatically.

---

## Your Options (Ranked by Simplicity)

### OPTION 1: Test Veo 3 Lip-Sync ($7.50 test + $67.50 production)

**What happens:**
1. Generate 10-second test clip with athlete speaking (~2 mins)
2. You review quality of lip-sync
3. If good → Generate full 90-second script ($67.50)
4. Done! No editing needed.

**Pros:**
- ✅ Simplest path (no setup required)
- ✅ 4K quality
- ✅ Already have Vertex AI access
- ✅ No editing skills needed

**Cons:**
- ❌ Higher cost ($75 total)
- ❌ Voice characteristics are random
- ❌ If test fails, wasted $7.50

**Timeline:** 2.5 hours total

**Command to run test:**
```bash
python test_veo3_lipsync.py
```

---

### OPTION 2: Use SadTalker (Open Source) ($2-5 total)

**What happens:**
1. Deploy SadTalker on GCP GPU instance (~2 hours)
2. Generate athlete portrait with Imagen 3 ($0.04)
3. Create voiceover with Lyria or text-to-speech ($0.18)
4. Run SadTalker to animate portrait with voiceover
5. Done!

**Pros:**
- ✅ Much cheaper ($2-5 vs $75)
- ✅ Full control over voiceover
- ✅ Can regenerate voice without re-rendering
- ✅ Proven technology

**Cons:**
- ❌ Requires GCP setup (2 hours)
- ❌ GPU instance costs while running
- ❌ Less photorealistic than Veo 3
- ❌ More complex workflow

**Timeline:** 3.5 hours total

---

### OPTION 3: Simplified Visual Story (No Voiceover) ($21.75)

**What happens:**
1. Generate 30-second visual-only video (what we were doing before)
2. Text cards burned into video (not overlays)
3. Lyria dramatic score
4. @asphaltcowb0y watermark
5. Done!

**Pros:**
- ✅ Medium cost ($21.75)
- ✅ No lip-sync risk
- ✅ Proven workflow
- ✅ High quality visuals

**Cons:**
- ❌ No voiceover (less powerful)
- ❌ Text cards less engaging
- ❌ Not the full script you wanted

**Timeline:** 2 hours

---

## My Recommendation

### Test Veo 3 First (Option 1)

**Why:**
1. It's the simplest path IF it works
2. $7.50 test is low risk
3. If it works, you get the FULL script with voiceover
4. If it fails, pivot to SadTalker (Option 2)

**How to execute:**
```bash
cd /home/jeremy/000-projects/iams/pipelinepilot
python test_veo3_lipsync.py
```

**Review criteria:**
- Do lips match spoken words?
- Does voice sound natural?
- Is audio quality clear?
- Any visual artifacts?

**If test passes:** Generate full 90-second video ($67.50)
**If test fails:** Deploy SadTalker ($2-5)

---

## Budget Impact

| Approach | Test Cost | Production Cost | Total | Remaining Budget |
|----------|-----------|-----------------|-------|------------------|
| **Veo 3** | $7.50 | $67.50 | $75.00 | $2,889 |
| **SadTalker** | $0 | $2-5 | $2-5 | $2,958 |
| **Visual-Only** | $0 | $21.75 | $21.75 | $2,942 |

Started with: **$3,000**
Already spent: **$36** (test clips from earlier)

---

## What You Need to Decide

**Question:** Which approach do you want?

**A)** Test Veo 3 lip-sync NOW
- I'll run the test script
- 2 minutes to generate
- You review quality
- Then decide on full production

**B)** Skip test, deploy SadTalker
- Cheaper but more complex
- 2 hours setup time
- Guaranteed lip-sync quality

**C)** Simplified visual-only video
- No voiceover risk
- Proven workflow
- Not the full script you wanted

---

## Files Ready to Execute

### Option A - Test Script
**Location:** `/home/jeremy/000-projects/iams/pipelinepilot/test_veo3_lipsync.py`
**Command:** `python test_veo3_lipsync.py`
**Cost:** $7.50
**Time:** 2 minutes

### Option B - SadTalker Deployment
**Documentation:** `000-docs/nwsl/VEO3_LIPSYNC_RESEARCH.md` (section: "Open-Source Alternatives")
**Setup Time:** 2 hours
**Cost:** $2-5

### Option C - Visual-Only Script
**Documentation:** `000-docs/nwsl/VEO_3.1_EXTENSION_PLAN.md`
**Command:** (need to create if chosen)
**Cost:** $21.75
**Time:** 2 hours

---

## My Final Recommendation

**Run the Veo 3 test NOW.**

It's only $7.50 and takes 2 minutes to generate. If it works, you get the full 90-second script with voiceover for $67.50 total. If it doesn't work, we've only spent $7.50 and can pivot to SadTalker.

**To proceed, just say:** "Test Veo 3" or "Run test_veo3_lipsync.py"

---

**Last Updated:** 2025-11-06 23:05 UTC
**Status:** Awaiting your decision
