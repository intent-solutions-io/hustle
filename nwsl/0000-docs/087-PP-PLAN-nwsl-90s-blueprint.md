# 90-Second NWSL Documentary Blueprint

**Date:** 2025-11-09  
**Owner:** Production Engineering  
**Status:** In Progress

## Overview
- **Objective:** Deliver a 90s documentary cut built from Veo 3.1 8s/6s clips, two 4s Lyria bridges, and a 6s outro.
- **Tone:** Safety-optimized sports journalism – inspirational visuals, factual narration (voiceover-led), zero sensational overlays.
- **Assets Needed:**
  - 11 bespoke Veo clips (8×8s, 3×6s)
  - 2 Lyria orchestral stingers (4s each)
  - 6s twilight outro with branded fade
  - 14 VO lines (script provided)

## Segment Table
| # | Time | Duration | Visual Brief | Voiceover |
|---|------|----------|--------------|-----------|
| 1 | 0-8 | 8s | Joyful youth soccer scrimmage | “These girls dream…” |
| 2 | 8-14 | 6s | Focused youth training drills | “Every practice…” |
| 3 | 14-18 | 4s | Music bridge, no Veo | “(2s silence) But who makes the decisions?” |
| 4 | 18-26 | 8s | NWSL HQ / executive offices | “The National Women’s Soccer League…” |
| 5 | 26-32 | 6s | Washington Spirit investment visuals | “Michele Kang owns…” |
| 6 | 32-40 | 8s | Kansas City Current stadium showcase | “The Kansas City Current…” |
| 7 | 40-46 | 6s | Orlando Pride / Wilf luxury suite | “The Orlando Pride…” |
| 8 | 46-50 | 4s | Music bridge, policy emphasis | “These ownership groups make policy decisions.” |
| 9 | 50-58 | 8s | Policy / medical environment | “The league’s 2021 eligibility policy…” |
|10 | 58-64 | 6s | Player advocacy portrait | “Elizabeth Eddy…” |
|11 | 64-72 | 8s | Thoughtful youth bench | “Her statement was met with public criticism…” |
|12 | 72-78 | 6s | Empty twilight field | “Questions remain…” |
|13 | 78-84 | 6s | Determined athlete portrait | “When will league leadership…” |
|14 | 84-90 | 6s | Fade to black, brand card | “Women’s sports…” (+INTENT SOLUTIONS text) |

## Prompt & Audio Pack
- **Veo Prompts:** Sectioned per segment in `scripts/prompts/nwsl90_segments.json`.
- **Voiceover:** 14 lines rendered via gTTS (`tmp/voiceover_wav/vo_XX.wav`) – replace with studio VO before final mix.
- **Music:** Use `000-audio/001-MS-AUDM-ambient-base.wav` trimmed to 90s for bed plus separate 4s swells.

## Production Steps
1. **Generate Veo clips:** `scripts/generate_nwsl90_segments.sh` (writes to `gs://pipelinepilot-prod-veo-videos/nwsl90/segXX/`). Pull down to `tmp/nwsl90/raw/`.
2. **Conform lengths:** `scripts/conform_nwsl90_segments.py` trims to spec durations and rescales to 1080p/24fps.
3. **Assemble audio:** `scripts/mix_nwsl90_audio.py` lays VO on top of bed + transition swells (renders to `tmp/nwsl90/audio_mix.wav`).
4. **Online edit:** `scripts/build_nwsl90_master.sh` uses FFmpeg concat list + outro text overlay to render `000-complete/015-MS-VIDF-nwsl-90s-master.mp4`.
5. **QC:** Verify runtime (90.00s), loudness (-16 LUFS), and caption alignment. Export poster frame to `000-images/029-MS-IMAG-nwsl90-poster.png`.

## Outstanding Risks
- Several legacy clips (e.g., `047-MS-CLIP-segment-02-the-commissioner.mp4`) are corrupt (missing `moov`). Fresh Veo renders required.
- Two Lyria stems (`005-MS-AUDM-lyria-score.wav`, `006-MS-AUDM-lyria-score-alt.wav`) fail decoding – regenerate before mix.
- CI/GitHub pipeline must be updated to point at new prompt pack and storage prefix before automated runs.
