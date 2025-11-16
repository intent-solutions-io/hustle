#!/bin/bash
# validate-docs.sh - Validate v2.0 naming

echo "=========================================="
echo "v2.0 Filename Validation"
echo "=========================================="
echo ""

REGEX='^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9-]+\.(md|sql|tsx|yml|prisma|patch|json)$'
INVALID=0
VALID=0

for file in docs/*; do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    if [[ $basename =~ $REGEX ]]; then
      VALID=$((VALID + 1))
    else
      echo "❌ Invalid: $basename"
      INVALID=$((INVALID + 1))
    fi
  fi
done

echo ""
echo "Results:"
echo "  ✅ Valid files: $VALID"
echo "  ❌ Invalid files: $INVALID"
echo ""

if [ $INVALID -eq 0 ]; then
  echo "🎉 All filenames comply with v2.0 standard!"
else
  echo "⚠️  Some filenames need fixing"
fi

echo ""
echo "Category Distribution:"
for cat in PP AT DC TQ OD LS RA MC PM DR UC BL AA DD MS; do
  count=$(ls docs/*-$cat-* 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    printf "  %-4s %2d files\n" "$cat:" "$count"
  fi
done
