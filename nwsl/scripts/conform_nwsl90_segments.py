#!/usr/bin/env python3
"""Trim and normalise raw Veo clips for the 90-second master."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "tmp" / "nwsl90" / "raw"
EDIT_DIR = ROOT / "tmp" / "nwsl90" / "edit"

SEGMENTS = [
    ("01", "joy", 8.0),
    ("02", "training", 6.0),
    ("03", "league-hq", 8.0),
    ("04", "washington-spirit", 6.0),
    ("05", "kc-current-stadium", 8.0),
    ("06", "orlando-pride-suite", 6.0),
    ("07", "league-policy", 8.0),
    ("08", "player-advocacy", 6.0),
    ("09", "youth-bench", 8.0),
    ("10", "dusk-field", 6.0),
    ("11", "the-question", 6.0),
    ("12", "outro-fade", 6.0),
]


def ffmpeg_trim(src: Path, dest: Path, duration: float) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src),
        "-t",
        str(duration),
        "-vf",
        "scale=1920:1080,fps=24",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "17",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        str(dest),
    ]
    subprocess.run(cmd, check=True)


def main():
    if not RAW_DIR.exists():
        raise SystemExit(f"Missing raw clips directory: {RAW_DIR}")

    for seg_id, label, duration in SEGMENTS:
        src = RAW_DIR / f"seg{seg_id}_{label}.mp4"
        if not src.exists():
            print(f"⚠️  Missing source clip {src.name}, skipping")
            continue
        dest = EDIT_DIR / f"{seg_id}-{label}.mp4"
        print(f"🎯 Trimming seg{seg_id} to {duration:.1f}s")
        ffmpeg_trim(src, dest, duration)

    print(f"\n✅ Conformed clips available in {EDIT_DIR}")


if __name__ == "__main__":
    main()
