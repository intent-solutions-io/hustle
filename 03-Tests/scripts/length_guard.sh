#!/usr/bin/env bash
set -euo pipefail

max_chars=12000
shopt -s nullglob
files=(tests/outputs/*.json)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "No output files found under tests/outputs/." >&2
  exit 1
fi

for file in "${files[@]}"; do
  chars=$(wc -c <"$file")
  if [ "$chars" -gt "$max_chars" ]; then
    echo "Length guard failure: $file has $chars characters (limit $max_chars)." >&2
    exit 1
  fi
done

echo "Length guard PASS (${#files[@]} files)."
