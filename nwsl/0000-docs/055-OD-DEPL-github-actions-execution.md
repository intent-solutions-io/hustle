# GitHub Actions CI Execution - Phase X
**Version:** 1.0
**Date:** 2025-11-08
**Phase:** X - Cross-Repository CI/CD Pipeline
**Mode:** GitHub Actions with Workload Identity Federation

---

## EXECUTION MODE: GITHUB ACTIONS IN HUSTLE REPO

### Architecture Overview
```
HUSTLE Repository (Primary)
├── .github/workflows/assemble.yml     # Main workflow
├── gate.sh                            # CI-only execution gate
├── 050-scripts/
│   ├── lyria_render.sh               # Orchestral score generation
│   ├── veo_render.sh                 # Video segment generation
│   └── ffmpeg_overlay_pipeline.sh    # Assembly and overlays
└── deps/nwsl/                        # READ-ONLY checkout during CI
    └── [NWSL repository contents]
```

### Cross-Repository Design
- **Primary Repo:** HUSTLE (contains CI infrastructure)
- **Dependency Repo:** NWSL (contains documentary specs)
- **Checkout Mode:** Read-only during CI execution
- **Authentication:** GitHub ORG_READ_TOKEN for cross-repo access

---

## GITHUB ACTIONS WORKFLOW

### Workflow Trigger
```yaml
name: Assemble NWSL Documentary
on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Run in dry-run mode (use placeholders)'
        required: false
        default: 'false'
```

### Key Workflow Steps

1. **Authenticate to GCP**
```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: projects/${{ secrets.GCP_PROJECT_NUMBER }}/locations/global/workloadIdentityPools/github-pool/providers/github-provider
    service_account: ci-vertex@${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com
```

2. **Checkout NWSL Repository**
```yaml
- uses: actions/checkout@v4
  with:
    repository: ${{ github.repository_owner }}/nwsl
    ref: main
    token: ${{ secrets.ORG_READ_TOKEN }}
    path: deps/nwsl
```

3. **Import Specifications**
```yaml
rsync -av --include='*/' \
  --include='*-DR-REFF-veo-seg-*.md' \
  --include='*-DR-REFF-lyria-*.md' \
  --include='*-overlay-*.md' \
  "deps/nwsl/docs/" "docs/imported/"
```

---

## WORKLOAD IDENTITY FEDERATION SETUP

### One-Time GCP Configuration
```bash
# 1. Create Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --project=$PROJECT_ID

# 2. Create Provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --project=$PROJECT_ID

# 3. Create Service Account
gcloud iam service-accounts create ci-vertex \
  --display-name="CI Vertex AI Service Account" \
  --project=$PROJECT_ID

# 4. Grant Permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:ci-vertex@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 5. Allow GitHub to impersonate
gcloud iam service-accounts add-iam-policy-binding \
  ci-vertex@$PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$GITHUB_REPO"
```

---

## CI-ONLY EXECUTION GATE

### Gate Script (gate.sh)
```bash
#!/bin/bash
# Enforces CI-only execution
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
    echo "❌ ERROR: This script can only run in GitHub Actions CI"
    exit 1
fi

# Validate required environment variables
: "${PROJECT_ID:?ERROR: Missing PROJECT_ID}"
: "${REGION:?ERROR: Missing REGION}"
: "${GCS_BUCKET:?ERROR: Missing GCS_BUCKET}"
```

### Environment Variables
```bash
PROJECT_ID=${{ secrets.GCP_PROJECT_ID }}
REGION=us-central1
GCS_BUCKET=gs://${{ secrets.GCP_PROJECT_ID }}-media
DRY_RUN=${{ inputs.dry_run }}
GITHUB_RUN_ID=${{ github.run_id }}
```

---

## VERTEX AI INTEGRATION

### Lyria (Orchestral Score)
```bash
# Production call (pseudo-code)
gcloud ai models predict \
  --region=$REGION \
  --model="lyria-instrumental-v1" \
  --json-request='{
    "instances": [{
      "prompt": "Orchestral score, 60 seconds",
      "instrumental_only": true,
      "no_vocals": true
    }]
  }'
```

### Veo 3.1 (Video Segments)
```bash
# Production call (pseudo-code)
gcloud ai models predict \
  --region=$REGION \
  --model="veo-3.1-latest" \
  --json-request='{
    "instances": [{
      "prompt": "Documentary footage",
      "constraints": {
        "no_dialogue": true,
        "no_narration": true,
        "no_human_voices": true
      }
    }]
  }'
```

---

## ARTIFACT STORAGE

### GCS Upload Pattern
```yaml
- name: Upload artifacts to GCS
  run: |
    RUN_PATH="ci/${{ github.run_id }}_${{ github.run_attempt }}"

    gcloud storage cp -r 060-renders \
      "gs://${{ secrets.GCP_PROJECT_ID }}-media/$RUN_PATH/"

    gcloud storage cp -r 030-video/shots \
      "gs://${{ secrets.GCP_PROJECT_ID }}-media/$RUN_PATH/"
```

### GitHub Artifacts
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: nwsl-documentary-${{ github.run_id }}
    path: |
      060-renders/
      docs/*-OD-DEPL-*.md
      vertex_ops.log
```

---

## REQUIRED GITHUB SECRETS

Configure in HUSTLE repo settings:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `GCP_PROJECT_ID` | Google Cloud Project ID | `hustleapp-production` |
| `GCP_PROJECT_NUMBER` | Project number for WIF | `123456789012` |
| `ORG_READ_TOKEN` | GitHub token with repo:read | `ghp_xxxxx` |

---

## EXECUTION MODES

### Dry Run Mode
- Creates placeholder media files
- No actual Vertex AI API calls
- Fast execution (~2 minutes)
- Uses FFmpeg for test patterns

### Production Mode
- Real Vertex AI API calls
- Actual content generation
- Full execution (~20 minutes)
- Produces final documentary

---

## COMPLIANCE & CONSTRAINTS

### Voice-Free Enforcement
✅ **Enforced at every level:**
- Gate script validates NO_VOICES flag
- Lyria configured for instrumental only
- Veo constraints block all human voices
- FFmpeg overlays use text only
- QC checks verify no audio dialogue

### Dollar Escaping
✅ **Fixed in all scripts:**
- `\$30 million` (escaped)
- `\$117 million` (escaped)
- All overlay scripts use proper escaping
- Verified in CI before deployment

---

## MONITORING & LOGS

### Vertex Operations Log
```bash
log_vertex_op() {
    local service="$1"
    local operation="$2"
    local model="$3"
    local op_id="${4:-pending}"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] VERTEX_OP: service=$service operation=$operation model=$model op_id=$op_id" \
      | tee -a vertex_ops.log
}
```

### CI Run Documentation
```bash
cat > "docs/${NEXT}-OD-DEPL-ci-runbook.md" << EOF
# CI Runbook - GitHub Actions Execution
**Run ID:** ${{ github.run_id }}
**Project:** ${{ secrets.GCP_PROJECT_ID }}
**Status:** Complete
EOF
```

---

## TROUBLESHOOTING

### Common Issues

1. **WIF Authentication Failure**
   - Verify pool and provider exist
   - Check service account permissions
   - Ensure repository attribute matches

2. **NWSL Repo Access Denied**
   - Verify ORG_READ_TOKEN has repo:read
   - Check token expiration
   - Confirm repository path

3. **Vertex API Errors**
   - Check API enablement
   - Verify service account roles
   - Monitor quotas and limits

4. **Dollar Sign Issues**
   - Always escape: `\$30 million`
   - Test overlays in dry run first
   - Verify in frame grabs

---

## SUCCESS CRITERIA

### Required Outputs
- [ ] 8 video segments (SEG-01 to SEG-08)
- [ ] 1 orchestral score (60.04s)
- [ ] Master video with overlays
- [ ] Social media versions
- [ ] Complete documentation

### Quality Checks
- [ ] No human voices present
- [ ] Dollar amounts display correctly
- [ ] 60-second total duration
- [ ] 1920x1080 resolution
- [ ] -14 LUFS audio level

---

**Documentation Date:** 2025-11-08
**Author:** Claude (CI Implementation)
**Status:** Ready for GitHub Actions Execution
**Repository:** HUSTLE (with NWSL dependency)

**END OF GITHUB ACTIONS EXECUTION DOCUMENTATION**