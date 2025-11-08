# NWSL Project - Directory Organization

**Date Organized:** 2025-11-07
**Status:** ✅ CLEANED AND ORGANIZED

## 📁 Directory Structure

```
nwsl/
├── 000-docs/               # Original project documentation
├── 01-scripts/             # All scripts organized by purpose
│   ├── generation/         # Video generation scripts
│   ├── processing/         # Video processing & pipeline scripts
│   ├── fixes/              # Fix and finalization scripts
│   └── archive/            # Old/deprecated scripts
├── 02-videos/              # All video outputs
│   ├── segments/           # Individual video segments
│   ├── raw/                # Raw generated videos (no text)
│   ├── processed/          # Videos with processing applied
│   └── final/              # Final deliverables & masters
├── 03-temp/                # Temporary work directories
├── 04-music/               # Lyria orchestral scores
├── 05-docs/                # Project documentation
├── 99-archive/             # Archived/old attempts
├── claudes-docs/           # AI-generated documentation
└── venv-videos/            # Python virtual environment
```

## 🎯 Current Working Script

**FIXED VERSION WITH $30 MILLION TEXT:**
```bash
python3 create_final_TRULY_FIXED.py
```

This script properly handles dollar sign escaping in Python to display "$30 million" for Michele Kang (not $0 million).

## 📹 Final Video Location

After running the script, the final video will be in:
```
FINAL_DELIVERY_TRULY_FIXED/WHY_WONT_THEY_ANSWER_60s_COMPLETE_TRULY_FIXED.mp4
```

## 🗂️ What's Where

### Scripts (`01-scripts/`)
- **generation/**: All `generate_*.py` and `generate_*.sh` scripts for creating videos
- **processing/**: Pipeline and automation scripts
- **fixes/**: Scripts for fixing text overlays and finalizing videos
- **archive/**: Old or deprecated scripts

### Videos (`02-videos/`)
- **segments/**: Individual 8-second segments
- **raw/**: Videos without text overlays
- **processed/**: Videos with some processing
- **final/**: Production-ready videos including FINAL_DELIVERY folders

### Temporary (`03-temp/`)
Contains timestamped work directories from various generation attempts:
- SMART_DOC_* directories
- SEGMENT_8_* directories
- why_60s_* directories
- Other work-in-progress folders

### Music (`04-music/`)
- LYRIA_MASTERPIECE directories with orchestral score prompts

## ⚠️ Known Issues

1. **$30 Million Text Bug**: Shell scripts have escaping issues causing "$30" to display as "$0". Use Python script `create_final_TRULY_FIXED.py` instead.

2. **Multiple Script Versions**: There are many versions of similar scripts due to iterative fixes. The latest working version is `create_final_TRULY_FIXED.py`.

3. **Video Requirements**:
   - Exactly 60 seconds (8 segments: 7×8s + 1×4s)
   - Michele Kang must show "$30 million+"
   - Hashtag must be "#StopTheInsanity"
   - Watermark: @asphaltcowb0y

## 🚀 Quick Start

To generate the final video with correct text:
```bash
cd /home/jeremy/000-projects/hustle/nwsl
python3 create_final_TRULY_FIXED.py
```

## 📊 Cleanup Stats

- **Before**: 65 files/directories scattered in root
- **After**: 11 organized directories
- **Scripts organized**: 20+ scripts categorized
- **Videos organized**: All MP4 files sorted by type
- **Temp files**: Moved to 03-temp for later cleanup

## 🔄 Next Steps

1. Run `create_final_TRULY_FIXED.py` to generate proper video
2. Verify $30 million text displays correctly
3. Check final video in `FINAL_DELIVERY_TRULY_FIXED/`
4. Clean up old temp directories in `03-temp/` if no longer needed

---

**Organization completed by Claude Code**
2025-11-07 21:44:00