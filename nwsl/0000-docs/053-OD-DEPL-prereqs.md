# Prerequisites Documentation - Phase X
**Version:** 1.0
**Date:** 2025-11-07
**Phase:** X - Execution Ownership
**Mode:** Local Machine Execution

---

## REQUIRED SYSTEM COMPONENTS

### Core Tools
| Component | Required Version | Check Command | Status |
|-----------|-----------------|---------------|--------|
| FFmpeg | ≥ 4.0 | `ffmpeg -version` | Required |
| FFprobe | ≥ 4.0 | `ffprobe -version` | Required |
| Bash | ≥ 4.0 | `bash --version` | Required |
| Python | ≥ 3.8 | `python3 --version` | Optional |
| Git | Any | `git --version` | Required |

### System Resources
| Resource | Requirement | Check Command | Critical |
|----------|------------|---------------|----------|
| Disk Space | > 10GB | `df -h .` | Yes |
| RAM | > 4GB | `free -h` | No |
| CPU Cores | ≥ 2 | `nproc` | No |
| Write Permissions | Project dir | `touch test.tmp && rm test.tmp` | Yes |

---

## DIRECTORY STRUCTURE

### Required Directories
```bash
# Create all required directories
mkdir -p 001-assets/refs/imagen
mkdir -p 020-audio/music
mkdir -p 020-audio/stems
mkdir -p 030-video/shots
mkdir -p 030-video/assembly
mkdir -p 040-overlays
mkdir -p 050-scripts
mkdir -p 060-renders/final
mkdir -p 060-renders/deliverables
mkdir -p 060-renders/logs
mkdir -p 060-renders/archive
```

### Verification
```bash
# Verify directory structure
for dir in 020-audio 030-video 040-overlays 050-scripts 060-renders; do
    if [ -d "$dir" ]; then
        echo "✓ $dir exists"
    else
        echo "✗ $dir missing - creating..."
        mkdir -p "$dir"
    fi
done
```

---

## ENVIRONMENT VARIABLES

### Local Execution Variables
```bash
# Set default environment
export FPS=24
export AUDIO_RATE_HZ=48000
export TARGET_LUFS=-14
export PROJECT_ID="nwsl-documentary"
export REGION="local"

# Optional: Load from .env if exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi
```

### Variable Validation
```bash
# Validate required variables
: "${FPS:?FPS not set}"
: "${AUDIO_RATE_HZ:?AUDIO_RATE_HZ not set}"
: "${TARGET_LUFS:?TARGET_LUFS not set}"
```

---

## GOOGLE CLOUD SETUP (Simulated for Local)

### Simulated GCP Environment
Since we're running locally without actual GCP access:
```bash
# Simulate GCP environment variables
export PROJECT_ID="nwsl-documentary-local"
export REGION="us-central1-simulated"
export GCS_BUCKET="gs://nwsl-documentary-local-media"

# Note: Actual GCP operations will be simulated
echo "GCP Environment (Simulated):"
echo "  PROJECT_ID: $PROJECT_ID"
echo "  REGION: $REGION"
echo "  GCS_BUCKET: $GCS_BUCKET"
```

### Simulated Vertex AI Operations
```bash
# Create placeholder for Vertex operations log
cat > docs/054-LS-STAT-vertex-ops.md << 'EOF'
# Vertex AI Operations Log (Simulated)
**Mode:** Local Dry Run
**Date:** 2025-11-07

## Simulated Operations

| Timestamp | Service | Operation | Model | Status |
|-----------|---------|-----------|-------|--------|
| Simulated | Veo 3.1 | Generate SEG-01 | veo-3.1-latest | DRY_RUN |
| Simulated | Veo 3.1 | Generate SEG-02 | veo-3.1-latest | DRY_RUN |
| Simulated | Lyria | Generate Score | lyria-instrumental | DRY_RUN |
| Simulated | Imagen | Style Frames | imagen-3.0 | DRY_RUN |

Note: Running in local dry run mode - no actual Vertex AI calls made.
EOF
```

---

## SCRIPT DEPENDENCIES

### Required Scripts
| Script | Path | Purpose | Status |
|--------|------|---------|--------|
| Overlay Pipeline | `050-scripts/ffmpeg_overlay_pipeline.sh` | Apply text overlays | ✓ Created |
| Video QC | `050-scripts/video_qc.sh` | Quality control | ✓ Created |
| Audio QC | `050-scripts/audio_qc.sh` | Audio validation | ✓ Created |
| Checksums | `050-scripts/generate_checksums.sh` | Package integrity | ✓ Created |

### Script Permissions
```bash
# Make all scripts executable
chmod +x 050-scripts/*.sh 2>/dev/null || true
```

---

## INPUT FILE REQUIREMENTS

### For Real Assembly
| File Type | Path Pattern | Count | Format |
|-----------|-------------|-------|--------|
| Video Segments | `030-video/shots/SEG-*_best.mp4` | 8 | H.264, 1920×1080, 24fps |
| Audio Master | `020-audio/music/master_mix.wav` | 1 | PCM, 48kHz, Stereo |
| Overlays | `040-overlays/why_overlays.ass` | 1 | ASS subtitle format |

### For Dry Run (Will Generate)
| Placeholder | Duration | Resolution | Content |
|-------------|----------|------------|---------|
| SEG-01 to SEG-07 | 8.0s each | 1920×1080 | Black with label |
| SEG-08 | 4.01s | 1920×1080 | Black with label |
| master_mix.wav | 60.04s | 48kHz stereo | Silent audio |

---

## FONT REQUIREMENTS

### Text Overlay Fonts
```bash
# Check for available fonts
fc-list | grep -iE "helvetica|arial|liberation" | head -5

# Fallback font (always available)
FONT_FILE="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

# Verify font exists
if [ -f "$FONT_FILE" ]; then
    echo "✓ Font available: $FONT_FILE"
else
    echo "✗ Font missing - using system default"
    FONT_FILE=""  # FFmpeg will use default
fi
```

---

## NETWORK REQUIREMENTS

### Local Mode
- No network required for dry run
- Internet optional for documentation references

### If Using Real Vertex AI
- Authenticated gcloud CLI
- Active internet connection
- Vertex AI API enabled
- Storage bucket access

---

## VALIDATION CHECKLIST

### System Ready
- [x] FFmpeg installed and working
- [x] Bash shell available
- [x] Directory structure created
- [x] Scripts executable
- [x] Sufficient disk space

### Dry Run Ready
- [x] Placeholder generation script ready
- [x] Assembly pipeline configured
- [x] Overlay files present
- [x] Dollar escaping verified

### Documentation Ready
- [x] Run mode documented (052)
- [x] Prerequisites documented (053)
- [ ] Preflight results pending
- [ ] Vertex ops log pending
- [ ] After Action Report pending

---

## ERROR HANDLING

### Common Issues and Fixes

1. **FFmpeg Not Found**
   ```bash
   # Install FFmpeg (Ubuntu/Debian)
   sudo apt-get update && sudo apt-get install ffmpeg
   ```

2. **Permission Denied**
   ```bash
   # Fix permissions
   chmod -R u+rwx .
   ```

3. **Disk Space Low**
   ```bash
   # Clean up old files
   rm -rf archive_*/
   df -h .
   ```

4. **Font Missing**
   ```bash
   # Install liberation fonts
   sudo apt-get install fonts-liberation
   ```

---

**Prerequisites Documented:** 2025-11-07
**Execution Mode:** Local Machine
**Status:** Ready for Dry Run

**END OF PREREQUISITES**