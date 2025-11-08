#!/usr/bin/env bash
# scaffold_verify.sh - Verify all canon files exist before production
set -euo pipefail

# Set root and docs directory
ROOT="$(pwd)"
: "${DOCS_DIR:=./docs}"

echo "🔍 Scaffold Verification"
echo "========================"
echo "DOCS_DIR: ${DOCS_DIR}"
echo "Working from: ${ROOT}"
echo ""

# Define all required canon files
req=(
  # Core canon documents
  "${DOCS_DIR}/6767-PP-PROD-master-brief.md"
  "${DOCS_DIR}/6767-DR-REFF-lyria-master.md"
  "${DOCS_DIR}/6767-DR-TMPL-overlay-style.md"

  # Video segment canon files (004-011)
  "${DOCS_DIR}/004-DR-REFF-veo-seg-01.md"
  "${DOCS_DIR}/005-DR-REFF-veo-seg-02.md"
  "${DOCS_DIR}/006-DR-REFF-veo-seg-03.md"
  "${DOCS_DIR}/007-DR-REFF-veo-seg-04.md"
  "${DOCS_DIR}/008-DR-REFF-veo-seg-05.md"
  "${DOCS_DIR}/009-DR-REFF-veo-seg-06.md"
  "${DOCS_DIR}/010-DR-REFF-veo-seg-07.md"
  "${DOCS_DIR}/011-DR-REFF-veo-seg-08.md"
)

# Check each required file
miss=0
echo "Checking canon files..."
for f in "${req[@]}"; do
  if [[ -f "$f" ]]; then
    echo "  ✅ $(basename "$f")"
  else
    echo "  ❌ MISSING: $f"
    miss=1
  fi
done

echo ""

# Check optional but recommended files
opt=(
  "${DOCS_DIR}/6767-DR-REFF-overlays-16x9.md"
  "${DOCS_DIR}/036-DD-DATA-overlay-map.csv"
)

echo "Checking optional files..."
for f in "${opt[@]}"; do
  if [[ -f "$f" ]]; then
    echo "  ✅ $(basename "$f")"
  else
    echo "  ⚠️  Optional: $(basename "$f") not found"
  fi
done

echo ""

# Exit status based on required files
if [[ $miss -eq 0 ]]; then
  echo "✅ OK: scaffold present - all required canon files exist"
  exit 0
else
  echo "❌ FATAL: scaffold missing - required canon files not found"
  echo ""
  echo "Please ensure all canon files exist in ${DOCS_DIR}/"
  echo "Run from nwsl/ directory with proper DOCS_DIR set"
  exit 1
fi