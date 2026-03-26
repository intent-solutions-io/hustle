#!/bin/bash
# Phase 0: Reset & Environment Sanity
set -euo pipefail

echo "🔄 PHASE 0: RESET & ENVIRONMENT SANITY"
echo "======================================"
echo ""

# 1. Check current directory
echo "📍 Current directory:"
pwd
echo ""

# 2. Check docs symlink
echo "📂 Checking docs symlink:"
if [ -L "docs" ]; then
    TARGET=$(readlink docs)
    echo "  ✅ docs -> $TARGET"
    if [ "$TARGET" = "000-docs" ]; then
        echo "  ✅ Symlink correct"
    else
        echo "  ❌ Symlink points to wrong target"
        exit 1
    fi
else
    echo "  ⚠️ docs symlink missing, creating..."
    ln -s 000-docs docs
    echo "  ✅ Created docs -> 000-docs"
fi
echo ""

# 3. Verify tools
echo "🔧 Verifying required tools:"
if command -v ffmpeg >/dev/null 2>&1; then
    echo "  ✅ ffmpeg: $(ffmpeg -version 2>&1 | head -1)"
else
    echo "  ❌ ffmpeg not found"
    exit 1
fi

if command -v jq >/dev/null 2>&1; then
    echo "  ✅ jq: $(jq --version)"
else
    echo "  ❌ jq not found"
    exit 1
fi

if command -v gcloud >/dev/null 2>&1; then
    echo "  ✅ gcloud: $(gcloud version --format='value(version.core.VERSION)')"
else
    echo "  ❌ gcloud not found"
    exit 1
fi
echo ""

# 4. Check gate.sh
echo "🔐 Checking gate.sh:"
if [ -f "gate.sh" ]; then
    echo "  ✅ gate.sh exists"
else
    echo "  ⚠️ gate.sh not found (may not be needed)"
fi
echo ""

# 5. Create logs directory
echo "📝 Creating logs directory:"
mkdir -p 070-logs
echo "  ✅ 070-logs/ created"
echo ""

# 6. Set environment variable
export DOCS_DIR="./docs"
echo "🌍 Environment:"
echo "  DOCS_DIR=$DOCS_DIR"
echo ""

# 7. Clean up any stray background processes
echo "🧹 Cleaning background processes:"
pkill -f "generate_all_segments" 2>/dev/null || true
pkill -f "regenerate_missing" 2>/dev/null || true
pkill -f "generate_bridges" 2>/dev/null || true
echo "  ✅ Cleaned up background tasks"
echo ""

echo "✅ PHASE 0 COMPLETE"
echo "=================="
echo "Environment ready for NWSL documentary pipeline"
