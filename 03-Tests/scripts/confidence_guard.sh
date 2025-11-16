#!/usr/bin/env bash
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not found; install jq to run confidence guard." >&2
  exit 1
fi

default_threshold=${CONFIDENCE_THRESHOLD_DEFAULT:-85}
shopt -s nullglob
files=(tests/outputs/*.json)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "No output files found under tests/outputs/." >&2
  exit 1
fi

for file in "${files[@]}"; do
  confidence=$(jq -r '.CONFIDENCE' "$file")
  if [ "$confidence" = "null" ]; then
    echo "Missing CONFIDENCE in $file" >&2
    exit 1
  fi
  threshold=$(jq -r '.META.CONFIDENCE_THRESHOLD // empty' "$file")
  if [ -z "$threshold" ] || [ "$threshold" = "null" ]; then
    threshold=$default_threshold
  fi
  uplift_count=$(jq '.UPLIFT | length' "$file")
  if [ "$confidence" -lt "$threshold" ] && [ "$uplift_count" -eq 0 ]; then
    echo "Confidence guard failure: $file has CONFIDENCE=$confidence but empty UPLIFT (threshold $threshold)." >&2
    exit 1
  fi
done

echo "Confidence guard PASS (${#files[@]} files)."
