# Assembly Preflight Test Plan
**Version:** 1.0
**Date:** 2025-11-07
**Phase:** 5X - Execution Gate + Dry Run
**Purpose:** Comprehensive preflight validation before assembly

---

## TEST MATRIX

### Category 1: File Existence
| Test ID | Component | Path | Required | Critical |
|---------|-----------|------|----------|----------|
| FE-01 | Video Segment 1 | `030-video/shots/SEG-01_best.mp4` | Yes | Yes |
| FE-02 | Video Segment 2 | `030-video/shots/SEG-02_best.mp4` | Yes | Yes |
| FE-03 | Video Segment 3 | `030-video/shots/SEG-03_best.mp4` | Yes | Yes |
| FE-04 | Video Segment 4 | `030-video/shots/SEG-04_best.mp4` | Yes | Yes |
| FE-05 | Video Segment 5 | `030-video/shots/SEG-05_best.mp4` | Yes | Yes |
| FE-06 | Video Segment 6 | `030-video/shots/SEG-06_best.mp4` | Yes | Yes |
| FE-07 | Video Segment 7 | `030-video/shots/SEG-07_best.mp4` | Yes | Yes |
| FE-08 | Video Segment 8 | `030-video/shots/SEG-08_best.mp4` | Yes | Yes |
| FE-09 | Audio Master | `020-audio/music/master_mix.wav` | Yes | Yes |
| FE-10 | ASS Overlays | `040-overlays/why_overlays.ass` | Yes | Yes |
| FE-11 | SRT Overlays | `040-overlays/why_overlays.srt` | No | No |
| FE-12 | FFmpeg Pipeline | `050-scripts/ffmpeg_overlay_pipeline.sh` | Yes | Yes |

### Category 2: Media Properties
| Test ID | Check | Expected Value | Tolerance | Critical |
|---------|-------|----------------|-----------|----------|
| MP-01 | Video Resolution | 1920×1080 | Exact | Yes |
| MP-02 | Video Frame Rate | 24fps | Exact | Yes |
| MP-03 | Video Codec | H.264/AVC | Any | No |
| MP-04 | Audio Sample Rate | 48000Hz | Exact | Yes |
| MP-05 | Audio Channels | Stereo (2) | Exact | Yes |
| MP-06 | Audio Format | WAV/PCM | Any PCM | No |

### Category 3: Duration Validation
| Test ID | Segment | Expected Duration | Tolerance | Critical |
|---------|---------|-------------------|-----------|----------|
| DV-01 | SEG-01 | 8.02s | ±0.04s | Yes |
| DV-02 | SEG-02 | 7.98s | ±0.04s | Yes |
| DV-03 | SEG-03 | 8.01s | ±0.04s | Yes |
| DV-04 | SEG-04 | 8.00s | ±0.04s | Yes |
| DV-05 | SEG-05 | 8.03s | ±0.04s | Yes |
| DV-06 | SEG-06 | 7.99s | ±0.04s | Yes |
| DV-07 | SEG-07 | 8.00s | ±0.04s | Yes |
| DV-08 | SEG-08 | 4.01s | ±0.04s | Yes |
| DV-09 | Total Video | 60.04s | ±0.5s | Yes |
| DV-10 | Audio Duration | 60.04s | ±0.5s | Yes |

### Category 4: Content Validation
| Test ID | Check | Location | Expected | Critical |
|---------|-------|----------|----------|----------|
| CV-01 | Dollar Escaping in ASS | `040-overlays/why_overlays.ass` | All $ escaped as \$ | Yes |
| CV-02 | Dollar Escaping in Scripts | `050-scripts/*.sh` | All $ in text escaped | Yes |
| CV-03 | Voice-Free Switches | `docs/032-OD-CONF-generation-switches.md` | generateAnyAudio: false | Yes |
| CV-04 | No Human Voices | Audio tracks | Silent or removed | Yes |
| CV-05 | Policy Text Accuracy | Overlay text | Matches approved copy | Yes |

### Category 5: System Requirements
| Test ID | Requirement | Command | Expected Output | Critical |
|---------|-------------|---------|-----------------|----------|
| SR-01 | FFmpeg Installed | `ffmpeg -version` | Version info | Yes |
| SR-02 | FFprobe Available | `ffprobe -version` | Version info | Yes |
| SR-03 | Bash Available | `bash --version` | Version ≥ 4.0 | Yes |
| SR-04 | Disk Space | `df -h .` | > 10GB free | Yes |
| SR-05 | Write Permissions | `touch test.tmp && rm test.tmp` | Success | Yes |

---

## TEST PROCEDURES

### Procedure 1: File Existence Tests
```bash
#!/bin/bash
echo "=== FILE EXISTENCE TESTS ==="
MISSING_COUNT=0

# Test each required file
for seg in {01..08}; do
    FILE="030-video/shots/SEG-${seg}_best.mp4"
    if [ -f "$FILE" ]; then
        echo "[PASS] FE-${seg}: $FILE exists"
    else
        echo "[FAIL] FE-${seg}: $FILE missing"
        ((MISSING_COUNT++))
    fi
done

# Test audio
if [ -f "020-audio/music/master_mix.wav" ]; then
    echo "[PASS] FE-09: Audio master exists"
else
    echo "[FAIL] FE-09: Audio master missing"
    ((MISSING_COUNT++))
fi

# Test overlays
if [ -f "040-overlays/why_overlays.ass" ]; then
    echo "[PASS] FE-10: ASS overlays exist"
else
    echo "[FAIL] FE-10: ASS overlays missing"
    ((MISSING_COUNT++))
fi

echo "Missing files: $MISSING_COUNT"
```

### Procedure 2: Media Properties Tests
```bash
#!/bin/bash
echo "=== MEDIA PROPERTIES TESTS ==="
FAIL_COUNT=0

# Check video properties
for seg in {01..08}; do
    FILE="030-video/shots/SEG-${seg}_best.mp4"
    if [ -f "$FILE" ]; then
        # Resolution
        RES=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$FILE")
        if [ "$RES" = "1920,1080" ]; then
            echo "[PASS] MP-01-${seg}: Correct resolution"
        else
            echo "[FAIL] MP-01-${seg}: Wrong resolution ($RES)"
            ((FAIL_COUNT++))
        fi

        # Frame rate
        FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "$FILE")
        if [ "$FPS" = "24/1" ]; then
            echo "[PASS] MP-02-${seg}: Correct frame rate"
        else
            echo "[FAIL] MP-02-${seg}: Wrong frame rate ($FPS)"
            ((FAIL_COUNT++))
        fi
    fi
done

echo "Failed property checks: $FAIL_COUNT"
```

### Procedure 3: Duration Tests
```bash
#!/bin/bash
echo "=== DURATION TESTS ==="
EXPECTED_DURATIONS=(8.02 7.98 8.01 8.00 8.03 7.99 8.00 4.01)
TOTAL_DURATION=0

for i in {0..7}; do
    seg=$(printf "%02d" $((i+1)))
    FILE="030-video/shots/SEG-${seg}_best.mp4"

    if [ -f "$FILE" ]; then
        DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FILE")
        EXPECTED=${EXPECTED_DURATIONS[$i]}

        # Calculate difference
        DIFF=$(echo "scale=3; $DURATION - $EXPECTED" | bc)
        ABS_DIFF=$(echo "scale=3; if ($DIFF < 0) -$DIFF else $DIFF" | bc)

        if (( $(echo "$ABS_DIFF <= 0.04" | bc -l) )); then
            echo "[PASS] DV-${seg}: Duration within tolerance (${DURATION}s)"
        else
            echo "[FAIL] DV-${seg}: Duration out of tolerance (${DURATION}s, expected ${EXPECTED}s)"
        fi

        TOTAL_DURATION=$(echo "scale=3; $TOTAL_DURATION + $DURATION" | bc)
    fi
done

echo "Total duration: ${TOTAL_DURATION}s (expected 60.04s)"
```

### Procedure 4: Dollar Escaping Tests
```bash
#!/bin/bash
echo "=== DOLLAR ESCAPING TESTS ==="

# Check ASS file
if [ -f "040-overlays/why_overlays.ass" ]; then
    # Look for proper escaping of $30 and $117
    if grep -q '\$30 million' "040-overlays/why_overlays.ass"; then
        echo "[PASS] CV-01: $30 million properly shown in ASS"
    else
        echo "[FAIL] CV-01: $30 million may not be properly escaped"
    fi

    if grep -q '\$117 million' "040-overlays/why_overlays.ass"; then
        echo "[PASS] CV-01: $117 million properly shown in ASS"
    else
        echo "[FAIL] CV-01: $117 million may not be properly escaped"
    fi
fi

# Check scripts
if grep -h '\$30\|\$117' 050-scripts/*.sh 2>/dev/null | grep -q '\\$'; then
    echo "[PASS] CV-02: Dollar signs escaped in scripts"
else
    echo "[WARNING] CV-02: Check dollar escaping in scripts"
fi
```

### Procedure 5: Voice-Free Verification
```bash
#!/bin/bash
echo "=== VOICE-FREE VERIFICATION ==="

# Check generation switches
FILE="docs/032-OD-CONF-generation-switches.md"
if [ -f "$FILE" ]; then
    if grep -q "generateAnyAudio: false" "$FILE"; then
        echo "[PASS] CV-03: Audio generation disabled"
    else
        echo "[FAIL] CV-03: Audio generation may be enabled"
    fi

    if grep -q "vocals: false" "$FILE"; then
        echo "[PASS] CV-03: Vocals disabled"
    else
        echo "[FAIL] CV-03: Vocals may be enabled"
    fi
fi
```

---

## DECISION TREE

```
START
  |
  v
All files exist?
  |
  No --> Execute DRY RUN
  |
  Yes
  |
  v
All properties valid?
  |
  No --> Log warnings, Continue
  |
  Yes
  |
  v
Dollar escaping verified?
  |
  No --> FIX REQUIRED
  |
  Yes
  |
  v
Voice-free confirmed?
  |
  No --> ABORT
  |
  Yes
  |
  v
EXECUTE REAL ASSEMBLY
```

---

## PASS/FAIL CRITERIA

### Critical Failures (Abort Assembly)
- Any video segment missing (unless dry run)
- Audio master missing (unless dry run)
- Wrong resolution or frame rate
- Voice generation enabled
- Unescaped dollar signs in critical paths

### Warnings (Continue with Caution)
- Minor duration discrepancies (< 0.5s total)
- Non-critical files missing (SRT)
- Codec differences

### Pass Conditions
- All critical files present OR dry run mode
- All media properties within spec
- Dollar escaping verified
- Voice-free mode confirmed
- Total duration within 60.04s ±0.5s

---

## TEST EXECUTION LOG

```
Test Suite: Assembly Preflight
Date: [To be filled]
Tester: Automated
Environment: Production

[Results will be logged to 044-LS-STAT-preflight-results.md]
```

---

**Test Plan Generated:** 2025-11-07
**Status:** Ready for execution
**Next:** Run tests and log results

**END OF TEST PLAN**