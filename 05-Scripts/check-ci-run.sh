#!/usr/bin/env bash
# Bounded CI status checker - max 5 checks, 30s between each
# Usage: check-ci-run.sh [RUN_ID]
# If RUN_ID not provided, gets latest main branch CI run

set -euo pipefail

MAX_CHECKS=5
SLEEP_SECONDS=30
WORKFLOW_NAME="CI"
BRANCH="main"

# Get run ID from arg or find latest
if [[ $# -ge 1 ]]; then
    RUN_ID="$1"
else
    RUN_ID=$(gh run list --workflow "$WORKFLOW_NAME" --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')
    if [[ -z "$RUN_ID" || "$RUN_ID" == "null" ]]; then
        echo "ERROR: No CI runs found for workflow '$WORKFLOW_NAME' on branch '$BRANCH'"
        exit 1
    fi
fi

echo "Checking CI run $RUN_ID (max $MAX_CHECKS checks, ${SLEEP_SECONDS}s interval)"

for ((i=1; i<=MAX_CHECKS; i++)); do
    RESULT=$(gh run view "$RUN_ID" --json status,conclusion 2>&1) || {
        echo "ERROR: Failed to fetch run $RUN_ID"
        exit 1
    }

    STATUS=$(echo "$RESULT" | jq -r '.status')
    CONCLUSION=$(echo "$RESULT" | jq -r '.conclusion')

    echo "Check $i/$MAX_CHECKS: status=$STATUS conclusion=$CONCLUSION"

    if [[ "$STATUS" == "completed" ]]; then
        if [[ "$CONCLUSION" == "success" ]]; then
            echo "CI PASSED - run $RUN_ID completed successfully"
            exit 0
        else
            echo "CI FAILED - run $RUN_ID conclusion: $CONCLUSION"
            exit 1
        fi
    fi

    if [[ $i -lt $MAX_CHECKS ]]; then
        sleep $SLEEP_SECONDS
    fi
done

echo "CI still in progress after $MAX_CHECKS checks (~$((MAX_CHECKS * SLEEP_SECONDS))s)"
echo "Run URL: https://github.com/intent-solutions-io/hustle/actions/runs/$RUN_ID"
exit 2  # Exit code 2 = still running, check later
