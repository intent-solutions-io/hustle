#!/usr/bin/env bash
# _lro.sh - Shared utility for bounded long-running operation (LRO) polling
# Prevents infinite loops by enforcing absolute time limits
set -euo pipefail

# poll_lro - Poll a Vertex AI long-running operation until done or timeout
#
# Usage: poll_lro <operation_name> [max_seconds] [poll_interval]
#
# Arguments:
#   operation_name - Full operation name from API response (e.g., "projects/.../operations/...")
#   max_seconds    - Maximum time to poll in seconds (default: 1800)
#   poll_interval  - Seconds between polls (default: 10)
#
# Returns:
#   0   - Success, operation completed (prints full response JSON to stdout)
#   2   - HTTP error during polling
#   3   - LRO completed but with error
#   124 - Timeout reached before operation completed
#
# Example:
#   response=$(poll_lro "projects/123/operations/456" 1800 10) || { echo "Failed"; exit 1; }
#   gcs_uri=$(jq -r '.response.gcsOutputUri' <<<"$response")
#
poll_lro() {
  local op="$1"
  local max_s="${2:-1800}"
  local interval="${3:-10}"
  local t=0

  echo "[POLL] Starting poll for: ${op##*/}" >&2
  echo "[POLL] Max timeout: ${max_s}s, interval: ${interval}s" >&2

  while (( t < max_s )); do
    # Make polling request with defensive timeouts
    res="$(curl -sS --fail-with-body \
      --connect-timeout 10 \
      --max-time 60 \
      --retry 3 \
      --retry-all-errors \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      "https://us-central1-aiplatform.googleapis.com/v1/${op}")" || {
        echo "[POLL] HTTP error during polling" >&2
        return 2
      }

    # Check if operation is done
    done_flag="$(jq -r '.done // false' <<<"$res")"

    if [[ "$done_flag" == "true" ]]; then
      # Operation complete - check for errors
      err="$(jq -r '.error.message // empty' <<<"$res")"

      if [[ -n "$err" ]]; then
        echo "[POLL] LRO completed with error: $err" >&2
        echo "$res" >&2
        return 3
      fi

      echo "[POLL] ✅ Operation completed successfully after ${t}s" >&2
      echo "$res"
      return 0
    fi

    # Not done yet - show progress if available
    pct="$(jq -r '.metadata.progressPercent // empty' <<<"$res")"
    if [[ -n "$pct" ]]; then
      echo "[POLL] Progress: ${pct}% (elapsed: ${t}s)" >&2
    else
      echo "[POLL] Still processing... (elapsed: ${t}s)" >&2
    fi

    sleep "$interval"
    t=$((t + interval))
  done

  # Timeout reached
  echo "[POLL] ❌ Timeout reached after ${max_s}s" >&2
  return 124
}

# Export function for sourcing
export -f poll_lro 2>/dev/null || true
