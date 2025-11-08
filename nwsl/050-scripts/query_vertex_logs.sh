#!/usr/bin/env bash
# query_vertex_logs.sh - Query Cloud Logging for Vertex AI API calls
# Part of Phase 5 guardrails for observability
set -euo pipefail

echo "🔍 Vertex AI Logging Query"
echo "=========================="
echo ""

# Configuration
PROJECT_ID="${PROJECT_ID:-hustleapp-production}"
RUN_ID="${GITHUB_RUN_ID:-local}"
HOURS_BACK="${HOURS_BACK:-2}"  # Look back 2 hours by default

# Service account for CI (GitHub Actions)
CI_SA="github-actions-service-account@${PROJECT_ID}.iam.gserviceaccount.com"

# Calculate timestamp for query
TIMESTAMP=$(date -u -d "${HOURS_BACK} hours ago" +"%Y-%m-%dT%H:%M:%S.000Z")

echo "📊 Query Parameters:"
echo "  Project: ${PROJECT_ID}"
echo "  Service Account: ${CI_SA}"
echo "  Looking back: ${HOURS_BACK} hours (from ${TIMESTAMP})"
echo "  Run ID filter: ${RUN_ID}"
echo ""

# ============================================
# 1) LYRIA API CALLS
# ============================================
echo "🎵 Lyria API Calls (last 20):"
echo "------------------------------"

LYRIA_FILTER='resource.type="aiplatform.googleapis.com/Model"
AND resource.labels.model_id="lyria-002"
AND protoPayload.authenticationInfo.principalEmail="'${CI_SA}'"
AND timestamp>="'${TIMESTAMP}'"
AND (protoPayload.methodName=~".*predict.*" OR protoPayload.methodName=~".*Predict.*")'

echo "  Filter: Lyria model calls from CI service account"
echo ""

gcloud logging read "${LYRIA_FILTER}" \
    --project="${PROJECT_ID}" \
    --format="table(
        timestamp.date('%Y-%m-%d %H:%M:%S %Z'),
        httpRequest.status,
        protoPayload.methodName,
        protoPayload.response.name:label=LRO_NAME
    )" \
    --limit=20 || {
        echo "  ⚠️ No Lyria calls found in the last ${HOURS_BACK} hours"
    }

echo ""

# ============================================
# 2) VEO API CALLS
# ============================================
echo "🎬 Veo API Calls (last 20):"
echo "---------------------------"

VEO_FILTER='resource.type="aiplatform.googleapis.com/Model"
AND resource.labels.model_id="veo-3.0-generate-001"
AND protoPayload.authenticationInfo.principalEmail="'${CI_SA}'"
AND timestamp>="'${TIMESTAMP}'"
AND (protoPayload.methodName=~".*predictLongRunning.*" OR protoPayload.methodName=~".*PredictLongRunning.*")'

echo "  Filter: Veo model calls from CI service account"
echo ""

gcloud logging read "${VEO_FILTER}" \
    --project="${PROJECT_ID}" \
    --format="table(
        timestamp.date('%Y-%m-%d %H:%M:%S %Z'),
        httpRequest.status,
        protoPayload.methodName,
        protoPayload.response.name:label=LRO_NAME
    )" \
    --limit=20 || {
        echo "  ⚠️ No Veo calls found in the last ${HOURS_BACK} hours"
    }

echo ""

# ============================================
# 3) API ERRORS (400/500 codes)
# ============================================
echo "❌ API Errors (last 10):"
echo "------------------------"

ERROR_FILTER='resource.type="aiplatform.googleapis.com/Model"
AND (resource.labels.model_id="lyria-002" OR resource.labels.model_id="veo-3.0-generate-001")
AND protoPayload.authenticationInfo.principalEmail="'${CI_SA}'"
AND timestamp>="'${TIMESTAMP}'"
AND httpRequest.status>=400'

echo "  Filter: 4xx/5xx errors from Lyria or Veo"
echo ""

gcloud logging read "${ERROR_FILTER}" \
    --project="${PROJECT_ID}" \
    --format="table(
        timestamp.date('%Y-%m-%d %H:%M:%S'),
        httpRequest.status,
        resource.labels.model_id,
        protoPayload.status.message
    )" \
    --limit=10 || {
        echo "  ✅ No API errors found (good!)"
    }

echo ""

# ============================================
# 4) LRO OPERATIONS STATUS
# ============================================
echo "⏳ Long-Running Operations (last 10):"
echo "-------------------------------------"

LRO_FILTER='resource.type="aiplatform.googleapis.com/Operation"
AND protoPayload.authenticationInfo.principalEmail="'${CI_SA}'"
AND timestamp>="'${TIMESTAMP}'"
AND (protoPayload.methodName=~".*GetOperation.*" OR protoPayload.response.done=true)'

echo "  Filter: LRO polling and completions"
echo ""

gcloud logging read "${LRO_FILTER}" \
    --project="${PROJECT_ID}" \
    --format="table(
        timestamp.date('%H:%M:%S'),
        protoPayload.response.done:label=DONE,
        protoPayload.response.name:label=OPERATION,
        protoPayload.response.metadata.state:label=STATE
    )" \
    --limit=10 || {
        echo "  ⚠️ No LRO operations found"
    }

echo ""

# ============================================
# 5) SUMMARY STATISTICS
# ============================================
echo "📊 Summary Statistics:"
echo "---------------------"

# Count Lyria calls
LYRIA_COUNT=$(gcloud logging read "${LYRIA_FILTER}" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=1000 2>/dev/null | wc -l)

# Count Veo calls
VEO_COUNT=$(gcloud logging read "${VEO_FILTER}" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=1000 2>/dev/null | wc -l)

# Count errors
ERROR_COUNT=$(gcloud logging read "${ERROR_FILTER}" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=1000 2>/dev/null | wc -l)

echo "  Total Lyria calls: ${LYRIA_COUNT}"
echo "  Total Veo calls: ${VEO_COUNT}"
echo "  Total API errors: ${ERROR_COUNT}"
echo ""

# ============================================
# 6) EXPORT FOR CI
# ============================================
if [ "${CI:-false}" = "true" ]; then
    # Write summary to file for CI artifact
    mkdir -p docs
    REPORT_FILE="docs/$(date +%s)-LS-STAT-vertex-log-query.md"

    cat > "${REPORT_FILE}" << EOF
# Vertex AI Log Query Report
**Date:** $(date +%Y-%m-%d\ %H:%M:%S)
**Run ID:** ${RUN_ID}
**Hours Back:** ${HOURS_BACK}
**Project:** ${PROJECT_ID}

## Summary
- Lyria API calls: ${LYRIA_COUNT}
- Veo API calls: ${VEO_COUNT}
- API errors: ${ERROR_COUNT}

## Status
$(if [ "${LYRIA_COUNT}" -gt 0 ] && [ "${VEO_COUNT}" -gt 0 ]; then
    echo "✅ Both Lyria and Veo were called successfully"
elif [ "${ERROR_COUNT}" -gt 0 ]; then
    echo "❌ API errors detected - check error logs"
else
    echo "⚠️ Missing expected API calls"
fi)

## Query Timestamp
From: ${TIMESTAMP}
To: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
EOF

    echo "📝 Report written to ${REPORT_FILE}"
fi

echo ""
echo "✅ Log query complete!"
echo ""
echo "💡 Tips:"
echo "  - To look back further: HOURS_BACK=24 $0"
echo "  - To filter by run: GITHUB_RUN_ID=123456 $0"
echo "  - For CI export: CI=true $0"