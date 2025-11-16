#!/usr/bin/env bash
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not found; install jq to run readiness guard." >&2
  exit 1
fi

valid_verdicts=("READY" "NOT_READY" "FOLLOW_UP")
max_reason_len=220

shopt -s nullglob
files=(tests/outputs/*.json)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "No output files found under tests/outputs/." >&2
  exit 1
fi

for file in "${files[@]}"; do
  verdict=$(jq -r '.CUSTOMER_READINESS_CHECK.VERDICT' "$file")
  reason=$(jq -r '.CUSTOMER_READINESS_CHECK.SHORT_REASON' "$file")

  if [ "$verdict" = "null" ] || [ -z "$verdict" ]; then
    echo "Readiness guard failure: missing verdict in $file" >&2
    exit 1
  fi

  valid=false
  for candidate in "${valid_verdicts[@]}"; do
    if [ "$verdict" = "$candidate" ]; then
      valid=true
      break
    fi
  done
  if [ "$valid" = false ]; then
    echo "Readiness guard failure: invalid verdict '$verdict' in $file" >&2
    exit 1
  fi

  if [ "$reason" = "null" ] || [ -z "$reason" ]; then
    echo "Readiness guard failure: missing SHORT_REASON in $file" >&2
    exit 1
  fi

  reason_len=${#reason}
  if [ "$reason_len" -gt "$max_reason_len" ]; then
    echo "Readiness guard failure: SHORT_REASON length $reason_len exceeds $max_reason_len in $file" >&2
    exit 1
  fi
done

echo "Readiness guard PASS (${#files[@]} files)."
