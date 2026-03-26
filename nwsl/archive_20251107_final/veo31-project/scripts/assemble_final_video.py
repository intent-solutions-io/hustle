#!/usr/bin/env python3
"""
VEO 3.1 VIDEO PROJECT - Assemble final 60-second video with text overlays
"""

import os
import subprocess
from datetime import datetime

# Text overlays with EXACT timing and text as specified
TEXT_OVERLAYS = [
    # Segment 1: No text (let innocence breathe)

    # Segment 2: Commissioner
    {"time": 10, "duration": 3, "text": "Commissioner Jessica Berman"},
    {"time": 13, "duration": 2, "text": "Receives her marching orders from majority owners"},

    # Segment 3: Michele Kang - MUST SHOW $30 MILLION
    {"time": 17, "duration": 3, "text": "Michele Kang - Washington Spirit"},
    {"time": 20, "duration": 2, "text": "Spent $30 million+ on women's soccer"},  # CRITICAL: $30 not $0!
    {"time": 22, "duration": 2, "text": "Why no answer?"},

    # Segment 4: Angie Long
    {"time": 25, "duration": 3, "text": "Angie Long - Kansas City Current"},
    {"time": 28, "duration": 2, "text": "Built a $117 million stadium for women"},
    {"time": 30, "duration": 2, "text": "...only to let males play"},

    # Segment 5: The Wilfs
    {"time": 33, "duration": 2, "text": "The Wilf Family - Orlando Pride"},
    {"time": 35, "duration": 2, "text": "What excuse will they use?"},
    {"time": 37, "duration": 3, "text": "Money, probably."},

    # Segment 6: The Policy
    {"time": 41, "duration": 3, "text": "The 2021 NWSL Policy remains in place"},
    {"time": 44, "duration": 4, "text": "Males can compete with castration or testosterone blockers"},

    # Segment 7: Confusion
    {"time": 49, "duration": 2, "text": "Thousands of young girls are asking..."},
    {"time": 51, "duration": 3, "text": "Is it all about the money?"},
    {"time": 54, "duration": 3, "text": "What happened to women playing women?"},

    # Segment 8: Final question
    {"time": 57, "duration": 3, "text": "Why won't you answer them?"},
]

# Watermark and hashtag
WATERMARK = "@asphaltcowb0y"
HASHTAG = "#StopTheInsanity"

def create_ffmpeg_filter():
    """Create FFmpeg filter for all text overlays"""
    filters = []

    # Add all text overlays
    for overlay in TEXT_OVERLAYS:
        # Properly escape dollar signs for shell
        text = overlay["text"].replace("$", "\\$").replace("'", "\\'")
        filter_str = (
            f"drawtext=text='{text}':"
            f"fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:"
            f"fontcolor=white:fontsize=48:"
            f"x=(w-text_w)/2:y=(h-text_h)/2:"
            f"enable='between(t,{overlay['time']},{overlay['time'] + overlay['duration']})':"
            f"shadowcolor=black@0.8:shadowx=3:shadowy=3"
        )
        filters.append(filter_str)

    # Add watermark (bottom right, always visible)
    watermark_filter = (
        f"drawtext=text='{WATERMARK}':"
        f"fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:"
        f"fontcolor=white:fontsize=28:"
        f"x=w-text_w-25:y=h-text_h-25:"
        f"shadowcolor=black@0.7:shadowx=2:shadowy=2"
    )
    filters.append(watermark_filter)

    # Add hashtag (bottom left, visible during last 6 seconds)
    hashtag_filter = (
        f"drawtext=text='{HASHTAG}':"
        f"fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:"
        f"fontcolor=white:fontsize=36:"
        f"x=25:y=h-text_h-25:"
        f"enable='between(t,54,60)':"
        f"shadowcolor=black@0.7:shadowx=2:shadowy=2"
    )
    filters.append(hashtag_filter)

    # Add final fade to black
    filters.append("fade=t=out:st=59:d=1")

    return ",".join(filters)

def assemble_video():
    """Assemble all segments into final video with music and text"""
    print("="*70)
    print("ASSEMBLING FINAL VEO 3.1 VIDEO")
    print("="*70)
    print(f"Timestamp: {datetime.now()}")

    # Check if segments exist
    segments = []
    for i in range(1, 9):
        segment_file = f"segments/segment_{i:02d}_*.mp4"
        # For now, create placeholder list
        segments.append(f"segment_{i:02d}.mp4")

    print("\n📹 Segments to assemble:")
    for i, seg in enumerate(segments, 1):
        duration = 4 if i == 8 else 8
        print(f"  {i}. {seg} ({duration}s)")

    # Create concatenation file
    concat_file = "segments/concat.txt"
    with open(concat_file, "w") as f:
        for segment in segments:
            f.write(f"file '{segment}'\n")

    # Build FFmpeg command
    filter_complex = create_ffmpeg_filter()

    cmd = [
        "ffmpeg",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-i", "music/lyria_orchestral_score_60s.wav",
        "-vf", filter_complex,
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "slow",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "final/VEO31_FINAL_60s_COMPLETE.mp4",
        "-y"
    ]

    print("\n🎬 Assembling video with:")
    print("  - All 8 segments")
    print("  - Lyria orchestral score")
    print(f"  - {len(TEXT_OVERLAYS)} text overlays")
    print(f"  - Watermark: {WATERMARK}")
    print(f"  - Hashtag: {HASHTAG}")

    # For now, just show the command
    print("\n⚠️  NOTE: FFmpeg command ready to run:")
    print(" ".join(cmd))

    print("\n✅ Final video will be: final/VEO31_FINAL_60s_COMPLETE.mp4")
    print("\nKey features:")
    print("  ✅ $30 million text for Michele Kang (NOT $0)")
    print("  ✅ $117 million for Angie Long's stadium")
    print("  ✅ Policy text about castration/testosterone blockers")
    print("  ✅ #StopTheInsanity hashtag")
    print("  ✅ @asphaltcowb0y watermark")

if __name__ == "__main__":
    assemble_video()