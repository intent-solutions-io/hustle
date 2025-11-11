#!/bin/bash
# gate.sh - CI-only execution gate for HUSTLE repo
# Enforces GitHub Actions WIF-only execution path

set -euo pipefail

# STRICT CI-ONLY ENFORCEMENT (No overrides)
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
    echo "❌ ERROR: CI-only execution (GitHub Actions WIF)"
    echo "This pipeline can ONLY run via GitHub Actions with Workload Identity Federation"
    echo "No local execution permitted. No Cloud Shell alternative."
    exit 1
fi

# Validate required environment variables
: "${PROJECT_ID:?ERROR: Missing PROJECT_ID environment variable}"
: "${REGION:?ERROR: Missing REGION environment variable}"
: "${GCS_BUCKET:?ERROR: Missing GCS_BUCKET environment variable}"

# Enforce single project ID
if [ "${PROJECT_ID}" != "hustleapp-production" ]; then
    echo "❌ ERROR: Invalid PROJECT_ID. Must be: hustleapp-production"
    echo "Received: ${PROJECT_ID}"
    exit 1
fi

# Verify gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ ERROR: gcloud CLI not found"
    exit 1
fi

# Set the project
gcloud config set project "${PROJECT_ID}"

# Verify WIF authentication (no keys allowed)
AUTH_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || true)
if [[ -z "${AUTH_ACCOUNT}" ]]; then
    echo "❌ ERROR: No active gcloud authentication"
    echo "Authentication must be via Workload Identity Federation"
    exit 1
fi

if [[ "${AUTH_ACCOUNT}" != *"gserviceaccount.com" ]]; then
    echo "❌ ERROR: Not authenticated via service account"
    echo "Current: ${AUTH_ACCOUNT}"
    echo "Expected: ci-vertex@hustleapp-production.iam.gserviceaccount.com"
    exit 1
fi

# Log environment info
echo "✅ CI Gate Check Passed"
echo "  Mode: GitHub Actions (WIF-only)"
echo "  Project ID: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  GCS Bucket: ${GCS_BUCKET}"
echo "  Service Account: ${AUTH_ACCOUNT}"
echo "  Run ID: ${GITHUB_RUN_ID:-unknown}"
echo "  Repository: ${GITHUB_REPOSITORY:-unknown}"
echo ""

# Export common functions for other scripts
log_vertex_op() {
    local service="$1"
    local operation="$2"
    local model="$3"
    local op_id="${4:-pending}"
    local status="${5:-unknown}"
    local http_code="${6:-N/A}"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] VERTEX_OP: service=$service operation=$operation model=$model op_id=$op_id status=$status http_code=$http_code" | tee -a vertex_ops.log
}

export -f log_vertex_op

# Success
echo "✅ Gate validation complete - CI execution authorized"