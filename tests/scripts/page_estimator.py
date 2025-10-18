#!/usr/bin/env python3
import glob
import math
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "outputs"))

files = sorted(glob.glob(os.path.join(OUTPUT_DIR, "*.json")))
if not files:
    print("No output files found under tests/outputs/.", file=sys.stderr)
    sys.exit(1)

def is_stress_case(path: str) -> bool:
    name = os.path.splitext(os.path.basename(path))[0].lower()
    if name in {"h", "stress", "oversize"}:
        return True
    if name.endswith("-h"):
        return True
    if "stress" in name:
        return True
    return False

failures = []
for file_path in files:
    with open(file_path, "r", encoding="utf-8") as fh:
        content = fh.read()
    chars = len(content)
    pages = round(chars / 3000.0, 1)
    stress = is_stress_case(file_path)
    limit = 6.0 if stress else 4.0
    if pages > limit:
        failures.append(f"{file_path} => {pages} pages (limit {limit})")
    else:
        print(f"{file_path}: {pages} pages (stress={stress})")

if failures:
    print("Page estimator failures:", file=sys.stderr)
    for line in failures:
        print(f"  {line}", file=sys.stderr)
    sys.exit(1)
