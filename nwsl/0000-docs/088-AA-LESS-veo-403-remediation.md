# VEO 3.x Vertex API – 403 Remediation Notes

**Date:** 2025-11-09  
**Owner:** Production Engineering  
**Status:** Blocked (External Follow-Up)

## Issue Summary
- When executing `scripts/generate_nwsl90_segments.sh` to hit `generativelanguage.googleapis.com` (`veo-3.0-generate-preview:predictLongRunning`), every request returns `403 PERMISSION_DENIED` with `reason: ACCESS_TOKEN_SCOPE_INSUFFICIENT`.
- The local machine successfully authenticates to GCP (`gcloud auth list` shows `jeremy@intentsolutions.io` with project `hustleapp-production`), but the Application Default Credentials only carry the `https://www.googleapis.com/auth/cloud-platform` scope.
- Attempts to re-run `gcloud auth application-default login --scopes=...generative-language` fail in the non-interactive session; manual browser auth is required.
- Even after enabling `generativelanguage.googleapis.com` in the project, requests continue to fail until the ADC token includes the `https://www.googleapis.com/auth/generative-language` scope.

## Steps Taken
1. Verified ADC token scopes via `curl https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=...` → scope limited to `cloud-platform`.
2. Enabled the API: `gcloud services enable generativelanguage.googleapis.com --project hustleapp-production`.
3. Revoked cached ADC creds (`gcloud auth application-default revoke --quiet`) and attempted re-login with the additional scope; the CLI prompted for browser verification, which cannot be completed in the current headless session.
4. Raised the issue via email (per owner instruction); awaiting resolution.

## Next Actions
1. Complete ADC login in an interactive shell:  
   `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/generative-language`
2. Re-run `bash scripts/generate_nwsl90_segments.sh` and confirm operations succeed (look for `Operation: operations/...` without 403).
3. Continue pipeline: `python scripts/conform_nwsl90_segments.py`, `python scripts/mix_nwsl90_audio.py`, `bash scripts/build_nwsl90_master.sh`.
4. Document any additional GCP IAM requirements if 403 persists (service account role adjustments, quota project alignment, etc.).

## Notes
- The 90-second build assets (prompts, VO, orchestration scripts) are ready and committed.
- No media was generated tonight; `tmp/nwsl90/raw/` remains empty pending API access.
- Keep this doc updated with responses from Google support regarding the 400/403 errors.
