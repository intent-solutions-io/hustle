#!/usr/bin/env python3
"""Build 90-second audio bed + VO for NWSL master."""

from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EDIT_DIR = ROOT / "tmp" / "nwsl90" / "edit"
VOICE_DIR = ROOT / "tmp" / "voiceover_wav"
BUILD_DIR = ROOT / "tmp" / "nwsl90"
OUTPUT_WAV = BUILD_DIR / "audio_mix.wav"

BACKGROUND = ROOT / "000-audio" / "001-MS-AUDM-ambient-base.wav"
MUSIC_SWELL = ROOT / "000-audio" / "004-MS-AUDM-dynamic-soundtrack.wav"

TIMELINE = [
    ("vo_01.wav", 0.0),
    ("vo_02.wav", 8.0),
    ("vo_03.wav", 14.0),
    ("vo_04.wav", 18.0),
    ("vo_05.wav", 26.0),
    ("vo_06.wav", 32.0),
    ("vo_07.wav", 40.0),
    ("vo_08.wav", 46.0),
    ("vo_09.wav", 50.0),
    ("vo_10.wav", 58.0),
    ("vo_11.wav", 64.0),
    ("vo_12.wav", 72.0),
    ("vo_13.wav", 78.0),
    ("vo_14.wav", 84.0),
]


def ensure_assets():
    if not BACKGROUND.exists():
        raise FileNotFoundError(BACKGROUND)
    if not VOICE_DIR.exists():
        raise FileNotFoundError(VOICE_DIR)
    missing = [name for name, _ in TIMELINE if not (VOICE_DIR / name).exists()]
    if missing:
        raise SystemExit(f"Missing VO files: {missing}")


def render_background():
    base = BUILD_DIR / "bed.wav"
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(BACKGROUND),
        "-ss",
        "0",
        "-t",
        "90",
        "-af",
        "acompressor=threshold=-18dB:ratio=2:attack=10:release=250,volume=-5dB",
        str(base),
    ]
    subprocess.run(cmd, check=True)
    return base


def render_swells():
    outputs = []
    markers = [(14.0, "swell1"), (46.0, "swell2")]
    for start, label in markers:
        out = BUILD_DIR / f"{label}.wav"
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(MUSIC_SWELL),
            "-ss",
            "0",
            "-t",
            "4",
            "-af",
            "afade=t=in:st=0:d=0.5,afade=t=out:st=3.5:d=0.5,volume=-6dB",
            str(out),
        ]
        subprocess.run(cmd, check=True)
        outputs.append((start, out))
    return outputs


def mix_audio():
    ensure_assets()
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    bed = render_background()
    swells = render_swells()

    # Prepare filter_complex graph
    inputs = []
    filters = [f"[0:a]adelay=0|0[a0]"]  # background
    inputs.append(str(bed))

    idx = 1
    for start, path in swells:
        inputs.append(str(path))
        delay_ms = int(start * 1000)
        filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[a{idx}]")
        idx += 1

    for name, start in TIMELINE:
        inputs.append(str(VOICE_DIR / name))
        delay_ms = int(start * 1000)
        filters.append(f"[{idx}:a]volume=6dB,adelay={delay_ms}|{delay_ms}[a{idx}]")
        idx += 1

    mix_inputs = "".join(f"[a{i}]" for i in range(idx))
    filter_complex = filters + [f"{mix_inputs}amix=inputs={idx}:normalize=0[aout]", "[aout]loudnorm=I=-16:TP=-1.5:LRA=7[audio]"]

    cmd = ["ffmpeg", "-y"]
    for path in inputs:
        cmd.extend(["-i", path])
    cmd.extend(["-filter_complex", ";".join(filter_complex), "-map", "[audio]", str(OUTPUT_WAV)])

    subprocess.run(cmd, check=True)
    print(f"✅ Audio mix rendered to {OUTPUT_WAV}")


if __name__ == "__main__":
    mix_audio()
