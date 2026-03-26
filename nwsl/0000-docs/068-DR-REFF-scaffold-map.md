# Scaffold Map - NWSL Documentary Production Repository
**Created:** 2025-11-08T16:30:00Z
**Purpose:** Reference map for canon-locked CI/CD production pipeline
**Status:** AUTHORITATIVE - Read before modifying any production scripts

---

## Repository Structure

```
nwsl/
├── 000-docs/                    # Documentation (6767 canon + operational docs)
│   ├── 004-DR-REFF-veo-seg-01.md       # SEG-01: The Innocence (8.0s)
│   ├── 005-DR-REFF-veo-seg-02.md       # SEG-02: The Commissioner (8.0s)
│   ├── 006-DR-REFF-veo-seg-03.md       # SEG-03: Michele Kang - Investment (8.0s)
│   ├── 007-DR-REFF-veo-seg-04.md       # SEG-04: Angie Long - Stadium (8.0s)
│   ├── 008-DR-REFF-veo-seg-05.md       # SEG-05: The Wilfs - Money (8.0s)
│   ├── 009-DR-REFF-veo-seg-06.md       # SEG-06: The Policy - Medical (8.0s)
│   ├── 010-DR-REFF-veo-seg-07.md       # SEG-07: The Confusion (8.0s)
│   ├── 011-DR-REFF-veo-seg-08.md       # SEG-08: Unanswered Question (4.0s)
│   ├── 036-DD-DATA-overlay-map.csv     # Overlay timing and text data
│   ├── 6767-PP-PROD-master-brief.md    # Master specification (SINGLE SOURCE OF TRUTH)
│   ├── 6767-DR-TMPL-overlay-style.md   # ASS overlay styling template
│   ├── 065-AA-AACR-production-run-attempt.md  # Previous AAR
│   ├── 066-AA-AACR-patch-implementation-http400.md  # Latest AAR
│   └── [other operational docs]
│
├── 001-assets/                  # Static assets (fonts, images)
│   └── fonts/                   # Typography for overlays
│
├── 020-audio/                   # Generated audio outputs
│   └── music/
│       └── master_mix.wav       # 60.04s orchestral score (from Lyria)
│
├── 030-video/                   # Generated video outputs
│   └── shots/
│       ├── SEG-01_best.mp4      # 8.0s (The Innocence)
│       ├── SEG-02_best.mp4      # 8.0s (The Commissioner)
│       ├── SEG-03_best.mp4      # 8.0s (Michele Kang)
│       ├── SEG-04_best.mp4      # 8.0s (Angie Long)
│       ├── SEG-05_best.mp4      # 8.0s (The Wilfs)
│       ├── SEG-06_best.mp4      # 8.0s (The Policy)
│       ├── SEG-07_best.mp4      # 8.0s (The Confusion)
│       └── SEG-08_best.mp4      # 4.0s (The Unanswered Question)
│
├── 040-overlays/                # Generated overlay files
│   └── overlays_16x9.ass        # ASS subtitle file with text overlays
│
├── 050-scripts/                 # Production automation scripts
│   ├── _lro.sh                  # Shared bounded LRO polling utility
│   ├── gate.sh                  # CI environment gate checks
│   ├── lyria_render.sh          # Lyria audio generation (CANON: reads from master brief)
│   ├── veo_render.sh            # Veo video generation (⚠️ NEEDS CANON ENFORCEMENT)
│   ├── overlay_sync.sh          # [TO BE CREATED] Read overlays from canon
│   ├── overlay_build.sh         # [TO BE CREATED] Generate ASS from canon
│   └── ffmpeg_overlay_pipeline.sh  # Final assembly with overlays + watermark
│
├── 060-renders/                 # Final assembled outputs
│   └── final/
│       └── master_16x9.mp4      # Complete 60s documentary
│
└── vertex_ops.log               # Vertex AI operation tracking log
```

---

## Canon Files - Single Source of Truth

### Master Specification
- **File:** `000-docs/6767-PP-PROD-master-brief.md`
- **Authority:** HIGHEST - All other documents derive from this
- **Contains:**
  - Complete segment breakdown (8 segments, 60.01s total)
  - Approved visual prompts for each segment
  - Text overlay content and timing
  - Watermark specification: `@asphaltcowb0y`
  - Hashtag: `#StopTheInsanity`
  - Audio direction: Instrumental only, no vocals

### Video Segment Canon (Veo Prompts)
All segments use format: `00N-DR-REFF-veo-seg-0N.md`

| File | Segment | Title | Duration | Key Elements |
|------|---------|-------|----------|--------------|
| 004 | SEG-01 | The Innocence | 8.0s | Young girls playing soccer, golden hour, joy |
| 005 | SEG-02 | The Commissioner | 8.0s | Empty executive office, cold institutional power |
| 006 | SEG-03 | Michele Kang - Investment | 8.0s | $30M check signing, stadium construction |
| 007 | SEG-04 | Angie Long - Stadium | 8.0s | CPKC Stadium aerial, beautiful but empty |
| 008 | SEG-05 | The Wilfs - Money | 8.0s | Rolex, contracts, profit calculations |
| 009 | SEG-06 | The Policy - Medical | 8.0s | Clinical environment, medication, consent forms |
| 010 | SEG-07 | The Confusion | 8.0s | Girls on bench at dusk, confusion and hurt |
| 011 | SEG-08 | Unanswered Question | 4.0s | Close-up, tear, devastating question |

**Critical:** Each segment file contains:
- YAML frontmatter with metadata
- Main content: Full photorealistic prompt for Veo
- Cinematography notes
- Style references
- NO vocals/dialogue requirement

### Audio Canon (Lyria)
- **File:** Embedded in `6767-PP-PROD-master-brief.md`
- **Prompt:** "Cinematic orchestral documentary score, emotional and powerful, E minor transitioning to G major, suitable for women's sports documentary about NWSL strike and labor negotiations, instrumental only with no vocals, orchestral strings brass and percussion, 60 second duration split into 8 musical cues"
- **Negative Prompt:** "vocals, spoken word, dialogue, singing, voice, narration"
- **Implementation:** TWO synchronous calls to `lyria-002:predict`, crossfade with 2s overlap
- **Output:** 60.04s at 48kHz stereo

### Overlay Canon
- **Data:** `000-docs/036-DD-DATA-overlay-map.csv`
- **Styling:** `000-docs/6767-DR-TMPL-overlay-style.md`
- **Critical Wording:**
  - "women's soccer" (NOT "women's" alone)
  - "$30 million" and "$117 million" (currency escaped as `\$30`, `\$117`)
  - "surgical castration or testosterone blockers" (exact medical terminology)
- **Format:** ASS (Advanced SubStation Alpha) with timing in `h:mm:ss.ms` format

---

## Script → Source Bindings (Data Flow)

### Current State (AS-IS)

```
lyria_render.sh
  ├── Sources: gate.sh, _lro.sh
  ├── Reads: [HARDCODED PROMPT - matches canon ✅]
  ├── Calls: Vertex AI lyria-002:predict (synchronous, TWO calls)
  ├── Outputs: 020-audio/music/master_mix.wav (60.04s)
  └── Logs: vertex_ops.log

veo_render.sh
  ├── Sources: gate.sh, _lro.sh
  ├── Reads: [HARDCODED PROMPTS - DOES NOT MATCH CANON ❌]
  ├── Calls: Vertex AI veo-3.0-generate-001:predictLongRunning (async with LRO polling)
  ├── Outputs: 030-video/shots/SEG-{01-08}_best.mp4
  └── Logs: vertex_ops.log

ffmpeg_overlay_pipeline.sh
  ├── Reads: [HARDCODED OVERLAY TEXT - canon compliance unknown ❌]
  ├── Inputs: 030-video/shots/*.mp4, 020-audio/music/master_mix.wav
  ├── Outputs: 060-renders/final/master_16x9.mp4
  └── Watermark: @asphaltcowb0y at 90% width, 95% height, 40% opacity ✅
```

### Required State (TO-BE) - Canon Locked

```
lyria_render.sh
  ├── Sources: gate.sh, _lro.sh
  ├── Reads: 000-docs/6767-PP-PROD-master-brief.md (audio section)
  ├── Calls: Vertex AI lyria-002:predict (synchronous, TWO calls)
  ├── Outputs: 020-audio/music/master_mix.wav (60.04s)
  └── Logs: vertex_ops.log

veo_render.sh [REQUIRES REFACTOR]
  ├── Sources: gate.sh, _lro.sh
  ├── Reads: 000-docs/00{4-11}-DR-REFF-veo-seg-{01-08}.md (dynamically)
  ├── Extracts: Prompt content from each segment file
  ├── Calls: Vertex AI veo-3.0-generate-001:predictLongRunning
  ├── Outputs: 030-video/shots/SEG-{01-08}_best.mp4
  └── Logs: vertex_ops.log

overlay_sync.sh [TO BE CREATED]
  ├── Reads: 000-docs/036-DD-DATA-overlay-map.csv
  ├── Reads: 000-docs/6767-DR-TMPL-overlay-style.md
  ├── Validates: Currency escaping (\$30, \$117)
  ├── Validates: Exact wording ("surgical castration or testosterone blockers")
  └── Outputs: JSON intermediate for overlay_build.sh

overlay_build.sh [TO BE CREATED]
  ├── Reads: Output from overlay_sync.sh
  ├── Generates: 040-overlays/overlays_16x9.ass
  ├── Format: ASS with timing in h:mm:ss.ms
  └── Truth Lock: SHA256 hash of overlay-map.csv

ffmpeg_overlay_pipeline.sh
  ├── Reads: 040-overlays/overlays_16x9.ass (generated from canon)
  ├── Inputs: 030-video/shots/*.mp4, 020-audio/music/master_mix.wav
  ├── Outputs: 060-renders/final/master_16x9.mp4
  └── Watermark: @asphaltcowb0y (unchanged)
```

---

## Working Directory Context (CI Environment)

### GitHub Actions Workflow
- **File:** `.github/workflows/assemble.yml`
- **Working Directory:** `nwsl/` (specified in step-level `working-directory` key)
- **Execution Context:**
  - Checkout at repo root: `/home/runner/work/hustle/hustle/`
  - Step execution: `/home/runner/work/hustle/hustle/nwsl/`
  - All relative paths in scripts resolve from `nwsl/`

### Path Resolution Examples
```bash
# Script execution (from nwsl/)
bash -eux 050-scripts/lyria_render.sh
  → Resolves to: /home/runner/work/hustle/hustle/nwsl/050-scripts/lyria_render.sh

# Reading canon segment file (from nwsl/)
cat 000-docs/004-DR-REFF-veo-seg-01.md
  → Resolves to: /home/runner/work/hustle/hustle/nwsl/000-docs/004-DR-REFF-veo-seg-01.md

# Output file (from nwsl/)
030-video/shots/SEG-01_best.mp4
  → Resolves to: /home/runner/work/hustle/hustle/nwsl/030-video/shots/SEG-01_best.mp4
```

### Environment Variables (Set in CI)
```bash
PROJECT_ID=${{ secrets.GCP_PROJECT_ID }}
REGION=us-central1
GCS_BUCKET=gs://${{ secrets.GCP_PROJECT_ID }}-media
DRY_RUN=${{ inputs.dry_run }}
GITHUB_RUN_ID=${{ github.run_id }}
```

---

## Current State vs Required State

### ✅ Compliant (No Changes Needed)
- `lyria_render.sh` - Prompt matches canon, using correct `:predict` endpoint
- `_lro.sh` - Bounded polling prevents hangs
- `gate.sh` - Environment validation working
- `ffmpeg_overlay_pipeline.sh` - Watermark correct
- Workflow timeouts - Job 120min, Lyria 20min, Veo 60min

### ❌ Non-Compliant (Requires Immediate Fix)
- **`veo_render.sh`** - Lines 28-37 contain hardcoded prompts that DO NOT match canon
  - Current: Generic scenes (stadium at night, press conference, courthouse)
  - Required: Specific emotional narrative from segment files 004-011
  - **Action:** Refactor to load prompts from `000-docs/00N-DR-REFF-veo-seg-0N.md`

### 🔨 Missing (Requires Creation)
- **`overlay_sync.sh`** - Read overlay data from `036-DD-DATA-overlay-map.csv`
- **`overlay_build.sh`** - Generate `040-overlays/overlays_16x9.ass` from canon
- **Truth Lock Mechanism** - SHA256 verification for drift detection

---

## Drift Prevention - Truth Lock Pattern

### Concept
Each production run must verify that generated content matches canon sources via SHA256 hash comparison.

### Implementation (To Be Created)
```bash
# Before production run
CANON_HASH=$(sha256sum 000-docs/036-DD-DATA-overlay-map.csv | awk '{print $1}')
echo "CANON_OVERLAY_HASH=$CANON_HASH" >> vertex_ops.log

# After overlay generation
GENERATED_HASH=$(sha256sum 040-overlays/overlays_16x9.ass | awk '{print $1}')
echo "GENERATED_OVERLAY_HASH=$GENERATED_HASH" >> vertex_ops.log

# Verification
if [ "$CANON_HASH" != "$EXPECTED_DERIVED_HASH" ]; then
  echo "❌ DRIFT DETECTED: Overlays do not match canon source"
  exit 1
fi
```

### Hash Registry (To Be Created)
- `000-docs/NNN-LS-STAT-canon-hashes.md` - Registry of known-good SHA256 hashes
- Updated on each approved canon modification
- Checked before each production run

---

## Production Vertex AI Models (GA)

### Audio Generation
- **Model ID:** `lyria-002`
- **Endpoint:** `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/lyria-002:predict`
- **Type:** Synchronous (immediate response)
- **Response Format:** Inline base64 audio in `predictions[0].audioContent`
- **Behavior:** Returns 1 clip per call (~30-33s)
- **Strategy:** Make TWO calls, crossfade with FFmpeg

### Video Generation
- **Model ID:** `veo-3.0-generate-001`
- **Endpoint:** `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.0-generate-001:predictLongRunning`
- **Type:** Asynchronous (Long-Running Operation)
- **Response Format:** GCS URI in `response.gcsOutputUri`
- **Polling:** Bounded with `_lro.sh` (max 3600s per segment)
- **Parameters:** 1080p, 16:9, 4s or 8s duration, no audio generation

---

## Next Steps for Canon Enforcement

### 1. Refactor `veo_render.sh` (HIGH PRIORITY)
- Replace hardcoded `SEGMENT_PROMPTS` array
- Create `load_canon_prompt()` function
- Read from `000-docs/00N-DR-REFF-veo-seg-0N.md` dynamically
- Extract prompt content (skip YAML frontmatter)
- Preserve all cinematography and style direction

### 2. Create `overlay_sync.sh` (HIGH PRIORITY)
- Parse `036-DD-DATA-overlay-map.csv`
- Read styling from `6767-DR-TMPL-overlay-style.md`
- Validate currency escaping
- Validate exact medical terminology
- Output JSON for next stage

### 3. Create `overlay_build.sh` (HIGH PRIORITY)
- Generate ASS file from validated JSON
- Apply styling template
- Calculate timing in h:mm:ss.ms format
- Write `040-overlays/overlays_16x9.ass`

### 4. Implement Truth Lock (MEDIUM PRIORITY)
- Create hash registry document
- Add verification to production scripts
- Log hashes to `vertex_ops.log`
- Fail production if drift detected

### 5. Production Run (AFTER ABOVE COMPLETE)
- Execute with `dry_run=false`
- Monitor for canon compliance
- Verify all op_ids logged
- Upload artifacts to GCS
- Create AAR with proof of canon alignment

---

**End of Scaffold Map**
**Status:** AUTHORITATIVE - Canon enforcement in progress
**Last Updated:** 2025-11-08T16:30:00Z
