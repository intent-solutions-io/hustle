#!/bin/bash
# PREFLIGHT CHECK - Verify environment before segment generation
set -euo pipefail

PROJECT_ID="pipelinepilot-prod"
BUCKET="gs://pipelinepilot-prod-veo-videos"

echo "════════════════════════════════════════════════════════════════"
echo "PREFLIGHT CHECK - SEGMENT GENERATION"
echo "════════════════════════════════════════════════════════════════"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# =============================================================================
# CHECK FUNCTIONS
# =============================================================================

pass() {
    echo "✅ $1"
    ((CHECKS_PASSED++))
}

fail() {
    echo "❌ $1"
    ((CHECKS_FAILED++))
}

warn() {
    echo "⚠️  $1"
    ((WARNINGS++))
}

# =============================================================================
# CHECKS
# =============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AUTHENTICATION & GCLOUD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check gcloud installed
if command -v gcloud &>/dev/null; then
    pass "gcloud CLI installed"
else
    fail "gcloud CLI not found - install from cloud.google.com/sdk"
fi

# Check authentication
if gcloud auth application-default print-access-token &>/dev/null; then
    pass "gcloud authenticated"
else
    fail "Not authenticated - run: gcloud auth application-default login"
fi

# Check project access
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    pass "Project access verified: $PROJECT_ID"
else
    fail "Cannot access project: $PROJECT_ID"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CLOUD STORAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check gsutil
if command -v gsutil &>/dev/null; then
    pass "gsutil installed"
else
    fail "gsutil not found - install with gcloud SDK"
fi

# Check bucket access
if gsutil ls "$BUCKET" &>/dev/null; then
    pass "Cloud Storage bucket accessible: $BUCKET"
else
    fail "Cannot access bucket: $BUCKET"
fi

# Check bucket write permissions
TEST_FILE="$BUCKET/preflight_test_$(date +%s).txt"
if echo "test" | gsutil cp - "$TEST_FILE" &>/dev/null; then
    gsutil rm "$TEST_FILE" &>/dev/null
    pass "Cloud Storage write permissions verified"
else
    fail "No write permissions to bucket: $BUCKET"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "REQUIRED TOOLS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check curl
if command -v curl &>/dev/null; then
    pass "curl installed"
else
    fail "curl not found - required for API calls"
fi

# Check jq
if command -v jq &>/dev/null; then
    pass "jq installed"
else
    fail "jq not found - install with: sudo apt-get install jq"
fi

# Check ffmpeg
if command -v ffmpeg &>/dev/null; then
    pass "ffmpeg installed"
else
    warn "ffmpeg not found - needed for preview extraction (optional)"
fi

# Check ffprobe
if command -v ffprobe &>/dev/null; then
    pass "ffprobe installed"
else
    warn "ffprobe not found - needed for duration checks (optional)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DIRECTORIES & FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check canon docs
CANON_DIR="/home/jeremy/000-projects/hustle/nwsl/000-docs"
CANON_COUNT=0

for seg_id in 01 02 03 04 05 06 07 08; do
    if [ -f "${CANON_DIR}/00$((seg_id + 3))-DR-REFF-veo-seg-${seg_id}.md" ]; then
        ((CANON_COUNT++))
    fi
done

if [ $CANON_COUNT -eq 8 ]; then
    pass "All 8 canon documents found"
else
    fail "Missing canon documents (found $CANON_COUNT/8)"
fi

# Check output directory
OUTPUT_DIR="/home/jeremy/000-projects/hustle/nwsl/003-raw-segments"
if [ -d "$OUTPUT_DIR" ]; then
    pass "Output directory exists: $OUTPUT_DIR"
else
    warn "Output directory not found, will be created: $OUTPUT_DIR"
fi

# Check logs directory
LOGS_DIR="/home/jeremy/000-projects/hustle/nwsl/007-logs/generation"
if [ -d "$LOGS_DIR" ]; then
    pass "Logs directory exists: $LOGS_DIR"
else
    warn "Logs directory not found, will be created: $LOGS_DIR"
fi

# Check scripts
SCRIPT_DIR="/home/jeremy/000-projects/hustle/nwsl/050-scripts"
if [ -x "${SCRIPT_DIR}/generate_all_segments_explicit.sh" ]; then
    pass "Main generation script executable"
else
    fail "Main script not executable: ${SCRIPT_DIR}/generate_all_segments_explicit.sh"
fi

if [ -x "${SCRIPT_DIR}/monitor_segments.sh" ]; then
    pass "Monitor script executable"
else
    warn "Monitor script not executable (optional)"
fi

if [ -x "${SCRIPT_DIR}/download_ready_segments.sh" ]; then
    pass "Download script executable"
else
    warn "Download script not executable (optional)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "EXISTING SEGMENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "$OUTPUT_DIR" ]; then
    EXISTING=0
    for seg_id in 01 02 03 04 05 06 07 08; do
        if [ -f "${OUTPUT_DIR}/SEG-${seg_id}.mp4" ]; then
            ((EXISTING++))
            echo "   ✓ SEG-${seg_id}.mp4 exists"
        fi
    done

    if [ $EXISTING -eq 0 ]; then
        echo "   (No existing segments - will generate all 8)"
    else
        echo ""
        echo "   Found $EXISTING/8 segments already downloaded"
        echo "   Use --resume flag to skip regenerating these"
    fi
else
    echo "   (Output directory not created yet)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API ENDPOINT TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test API endpoint reachability
LOCATION="us-central1"
MODEL_ID="veo-3.0-generate-001"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning"

echo "   Endpoint: $API_ENDPOINT"

if curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT" | grep -q "401\|403"; then
    pass "API endpoint reachable (auth required - expected)"
else
    warn "API endpoint test inconclusive (may still work)"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "PREFLIGHT SUMMARY"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Checks passed: $CHECKS_PASSED"
echo "❌ Checks failed: $CHECKS_FAILED"
echo "⚠️  Warnings: $WARNINGS"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo "🎉 READY TO GENERATE SEGMENTS!"
    echo ""
    echo "Next steps:"
    echo "  1. cd /home/jeremy/000-projects/hustle/nwsl"
    echo "  2. ./050-scripts/generate_all_segments_explicit.sh"
    echo ""
    exit 0
else
    echo "❌ PREFLIGHT FAILED - Fix errors above before generating"
    echo ""
    exit 1
fi
