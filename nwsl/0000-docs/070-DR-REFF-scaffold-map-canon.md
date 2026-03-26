# Scaffold Map - Canon-Locked NWSL Documentary Production
**Created:** 2025-11-08T14:15:00Z
**Purpose:** Complete canon-locked scaffold reference with DOCS_DIR bindings
**Status:** AUTHORITATIVE - Phase 1/2/3 Implementation Ready

---

## Repository Structure

```
nwsl/
├── 001-assets/                  # Static assets (fonts, images)
│   └── fonts/                   # Typography for overlays
├── 020-audio/                   # Generated audio outputs
│   └── music/
│       └── master_mix.wav       # 60.04s orchestral score
├── 030-video/                   # Generated video outputs
│   ├── shots/
│   │   ├── SEG-01_best.mp4     # 8.0s segments (01-07)
│   │   ├── SEG-02_best.mp4
│   │   ├── SEG-03_best.mp4
│   │   ├── SEG-04_best.mp4
│   │   ├── SEG-05_best.mp4
│   │   ├── SEG-06_best.mp4
│   │   ├── SEG-07_best.mp4
│   │   └── SEG-08_best.mp4     # 4.0s segment (08)
│   └── overlays/
│       └── overlays_16x9.ass    # Generated ASS subtitle file
├── 040-overlays/                # Overlay source files
│   └── overlays_16x9.ass        # ASS with text overlays
├── 050-scripts/                 # Production automation scripts
│   ├── _lro.sh                  # Shared bounded LRO polling
│   ├── gate.sh                  # CI environment gate checks
│   ├── lyria_render.sh          # Lyria audio generation
│   ├── veo_render.sh            # Veo video generation
│   ├── overlay_sync.sh          # Read overlays from canon
│   ├── overlay_build.sh         # Generate ASS from canon
│   ├── scaffold_verify.sh       # Canon file verification
│   ├── truth_lock.sh            # Overlay truth verification
│   └── ffmpeg_overlay_pipeline.sh # Final assembly
├── 060-renders/                 # Final assembled outputs
│   └── final/
│       └── master_16x9.mp4      # Complete 60s documentary
├── docs/  → 000-docs            # Symlink for compatibility
├── 000-docs/                    # Documentation (canon source)
│   ├── 004-DR-REFF-veo-seg-01.md  # SEG-01: The Innocence
│   ├── 005-DR-REFF-veo-seg-02.md  # SEG-02: The Commissioner
│   ├── 006-DR-REFF-veo-seg-03.md  # SEG-03: Michele Kang
│   ├── 007-DR-REFF-veo-seg-04.md  # SEG-04: Angie Long
│   ├── 008-DR-REFF-veo-seg-05.md  # SEG-05: The Wilfs
│   ├── 009-DR-REFF-veo-seg-06.md  # SEG-06: The Policy
│   ├── 010-DR-REFF-veo-seg-07.md  # SEG-07: The Confusion
│   ├── 011-DR-REFF-veo-seg-08.md  # SEG-08: Unanswered Question
│   ├── 6767-PP-PROD-master-brief.md    # Master specification
│   ├── 6767-DR-REFF-lyria-master.md    # Lyria audio canon
│   ├── 6767-DR-REFF-overlays-16x9.md   # Overlay text canon (TO CREATE)
│   └── 6767-DR-TMPL-overlay-style.md   # ASS styling template
└── vertex_ops.log               # Vertex AI operation tracking
```

---

## Canon Files List (All Using ${DOCS_DIR})

### Core Canon Documents
- `${DOCS_DIR}/6767-PP-PROD-master-brief.md` - Master specification
- `${DOCS_DIR}/6767-DR-REFF-lyria-master.md` - Audio generation prompt
- `${DOCS_DIR}/6767-DR-REFF-overlays-16x9.md` - Text overlay content (TO CREATE)
- `${DOCS_DIR}/6767-DR-TMPL-overlay-style.md` - ASS styling parameters

### Video Segment Canon (Veo Prompts)
- `${DOCS_DIR}/004-DR-REFF-veo-seg-01.md` - SEG-01: The Innocence (8s)
- `${DOCS_DIR}/005-DR-REFF-veo-seg-02.md` - SEG-02: The Commissioner (8s)
- `${DOCS_DIR}/006-DR-REFF-veo-seg-03.md` - SEG-03: Michele Kang (8s)
- `${DOCS_DIR}/007-DR-REFF-veo-seg-04.md` - SEG-04: Angie Long (8s)
- `${DOCS_DIR}/008-DR-REFF-veo-seg-05.md` - SEG-05: The Wilfs (8s)
- `${DOCS_DIR}/009-DR-REFF-veo-seg-06.md` - SEG-06: The Policy (8s)
- `${DOCS_DIR}/010-DR-REFF-veo-seg-07.md` - SEG-07: The Confusion (8s)
- `${DOCS_DIR}/011-DR-REFF-veo-seg-08.md` - SEG-08: Unanswered Question (4s)

---

## Script → Source Bindings

### Environment Setup
All scripts honor `DOCS_DIR` environment variable:
```bash
: "${DOCS_DIR:=./docs}"  # Default to ./docs if not set
```

### Script Bindings

#### veo_render.sh
- **Reads:** `${DOCS_DIR}/00N-DR-REFF-veo-seg-0N.md` (N=1-8)
- **Function:** `canon_seg_path()` generates path from segment number
- **Function:** `load_prompt()` extracts prompt from markdown
- **Outputs:** `030-video/shots/SEG-0N_best.mp4`
- **Fail Mode:** Exit 1 if canon file missing

#### lyria_render.sh
- **Reads:** `${DOCS_DIR}/6767-DR-REFF-lyria-master.md`
- **API:** `:predict` endpoint (synchronous)
- **Outputs:** `020-audio/music/master_mix.wav`
- **Strategy:** Two 30s calls → crossfade to 60.04s

#### overlay_sync.sh
- **Reads:** `${DOCS_DIR}/6767-DR-REFF-overlays-16x9.md`
- **Reads:** `${DOCS_DIR}/6767-DR-TMPL-overlay-style.md`
- **Validates:** Currency escaping (\$30, \$117)
- **Outputs:** JSON intermediate for overlay_build.sh

#### overlay_build.sh
- **Reads:** Output from overlay_sync.sh
- **Generates:** `040-overlays/overlays_16x9.ass`
- **Format:** ASS with timing in h:mm:ss.ms

#### ffmpeg_overlay_pipeline.sh
- **Reads:** `040-overlays/overlays_16x9.ass`
- **Inputs:** `030-video/shots/*.mp4`, `020-audio/music/master_mix.wav`
- **Outputs:** `060-renders/final/master_16x9.mp4`
- **Watermark:** @asphaltcowb0y (40% opacity, bottom right)

#### scaffold_verify.sh
- **Checks:** All canon files exist before production
- **Exit:** 0 if all present, 1 if any missing
- **Output:** "OK: scaffold present" or list of missing files

#### truth_lock.sh
- **Compares:** Generated ASS vs canon source
- **Exit:** 0 if match, 1 if mismatch
- **Output:** Diff to `docs/NNN-LS-STAT-truth-lock-fail.md` on failure

---

## CI Working Directory

### GitHub Actions Context
- **Workflow:** `.github/workflows/assemble.yml`
- **Working Directory:** `nwsl/` (set at step level)
- **Environment:**
  ```bash
  DOCS_DIR=./docs  # Relative to nwsl/
  PROJECT_ID=hustleapp-production
  REGION=us-central1
  ```

### Path Resolution
All paths resolve from `nwsl/` directory:
```bash
# Canon file access
${DOCS_DIR}/004-DR-REFF-veo-seg-01.md
  → ./docs/004-DR-REFF-veo-seg-01.md
  → nwsl/docs/004-DR-REFF-veo-seg-01.md (symlink)
  → nwsl/000-docs/004-DR-REFF-veo-seg-01.md (actual)

# Output paths
030-video/shots/SEG-01_best.mp4
  → nwsl/030-video/shots/SEG-01_best.mp4
```

---

## Canon Path Functions (Phase 2 Implementation)

### veo_render.sh Functions
```bash
# Set DOCS_DIR with default
: "${DOCS_DIR:=./docs}"

# Generate canon path for segment N
canon_seg_path() {
  printf "%s/%03d-DR-REFF-veo-seg-%02d.md" \
    "${DOCS_DIR}" "$((3+$1))" "$1"
}

# Load prompt from canon file
load_prompt() {
  local p="$(canon_seg_path "$1")"
  [[ -f "$p" ]] || {
    echo "[FATAL] Missing canon file: $p" >&2
    exit 1
  }
  # Extract prompt (skip frontmatter)
  awk '/^---$/{if(++c==2)next}/^(Conditioning:|Aspect:|Audio:|Repro:|NotesForPost:|## Text Overlays)/{exit}c==2&&NF' "$p" | \
    sed 's/  */ /g;s/^ *//;s/ *$//'
}
```

### Veo API Parameters
```json
{
  "instances": [{
    "prompt": "$(load_prompt $N)"
  }],
  "parameters": {
    "aspectRatio": "16:9",
    "resolution": "1080p",
    "durationSeconds": 8,  // or 4 for segment 8
    "generateAudio": false,
    "sampleCount": 1
  }
}
```

---

## Truth Lock Pattern

### Concept
Ensure generated overlays match canon source exactly:
```bash
# Before overlay generation
CANON_HASH=$(sha256sum ${DOCS_DIR}/6767-DR-REFF-overlays-16x9.md | awk '{print $1}')

# After ASS generation
GENERATED_CONTENT=$(extract_text_from_ass 040-overlays/overlays_16x9.ass)
GENERATED_HASH=$(echo "$GENERATED_CONTENT" | sha256sum | awk '{print $1}')

# Verify match
if [ "$CANON_HASH" != "$EXPECTED_HASH" ]; then
  echo "❌ DRIFT DETECTED: Overlays do not match canon"
  exit 1
fi
```

---

## Phase Status

### ✅ Phase 1: Scaffold Audit + Canon Map
- [x] DOCS_DIR added to workflow environment
- [x] Compatibility symlink created (docs → 000-docs)
- [x] Scaffold map document created (this file)
- [x] scaffold_verify.sh to be created

### 🔧 Phase 2: Bind Code to Canon + Harden Paths
- [ ] veo_render.sh updated with canon functions
- [ ] overlay_sync.sh created
- [ ] overlay_build.sh created
- [ ] truth_lock.sh created
- [ ] Remove all inline prompts

### 📹 Phase 3: Run Production Now
- [ ] Lyria audio generation (60.04s)
- [ ] Veo video generation (8 segments)
- [ ] Overlay application
- [ ] Final assembly
- [ ] GCS upload
- [ ] Documentation generation

---

**Status:** Ready for Phase 2 implementation
**Next Step:** Create scaffold_verify.sh and update veo_render.sh
**End Goal:** Real video generation with canon-locked content

---

**Last Updated:** 2025-11-08T14:15:00Z