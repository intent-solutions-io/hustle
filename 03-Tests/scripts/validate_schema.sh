#!/usr/bin/env bash
set -euo pipefail

SCHEMA="src/schema/diagpro.report.schema.json"
TARGET_GLOB="tests/outputs/*.json"

shopt -s nullglob
files=($TARGET_GLOB)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "No output files found under tests/outputs/." >&2
  exit 1
fi

if command -v ajv >/dev/null 2>&1; then
  ajv validate -s "$SCHEMA" -d "$TARGET_GLOB"
elif command -v npx >/dev/null 2>&1; then
  npx --yes ajv-cli@5.0.0 validate -s "$SCHEMA" -d "$TARGET_GLOB"
else
  echo "ERROR: Neither ajv CLI nor npx is available to run schema validation." >&2
  exit 1
fi
