# Workload Identity Federation Setup
**Version:** 1.0
**Date:** 2025-11-08
**Type:** Operations & Deployment
**Project ID:** hustleapp-production

---

## OVERVIEW

This document contains the EXACT commands to set up Workload Identity Federation (WIF) for GitHub Actions to access Google Cloud services WITHOUT service account keys.

**CRITICAL:** No keys are stored in the repository. Authentication uses OIDC tokens only.

---

## PREREQUISITES

1. **GCP Project:** hustleapp-production
2. **GitHub Repository:** [your-org]/hustle
3. **Required Roles:** Project Owner or IAM Admin
4. **gcloud CLI:** Authenticated and configured

---

## SETUP COMMANDS

### 1. Set Variables
```bash
# Replace with your actual values
export PROJECT_ID="hustleapp-production"
export PROJECT_NUMBER="123456789012"  # Get from GCP Console
export GITHUB_ORG="your-github-org"   # Your GitHub organization
export GITHUB_REPO="hustle"           # Repository name
```

### 2. Enable Required APIs
```bash
gcloud services enable iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  --project="${PROJECT_ID}"
```

### 3. Create Workload Identity Pool
```bash
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --description="Pool for GitHub Actions CI/CD" \
  --project="${PROJECT_ID}"
```

### 4. Create OIDC Provider
```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == '${GITHUB_ORG}'" \
  --project="${PROJECT_ID}"
```

### 5. Create Service Account
```bash
gcloud iam service-accounts create "ci-vertex" \
  --display-name="CI Vertex AI Service Account" \
  --description="Service account for GitHub Actions CI to access Vertex AI" \
  --project="${PROJECT_ID}"
```

### 6. Grant Required Permissions
```bash
# Vertex AI User (for Lyria and Veo)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:ci-vertex@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Storage Admin (for GCS uploads)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:ci-vertex@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Logging Writer (for audit trails)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:ci-vertex@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### 7. Allow Repository to Impersonate Service Account
```bash
gcloud iam service-accounts add-iam-policy-binding \
  "ci-vertex@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}" \
  --project="${PROJECT_ID}"
```

### 8. Get Pool Provider Path (for GitHub Actions)
```bash
# Save this output - needed for GitHub workflow
gcloud iam workload-identity-pools providers describe "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)" \
  --project="${PROJECT_ID}"
```

Expected output format:
```
projects/123456789012/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

---

## GITHUB SECRETS CONFIGURATION

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Value | Source |
|------------|-------|--------|
| `GCP_PROJECT_ID` | hustleapp-production | Fixed |
| `GCP_PROJECT_NUMBER` | 123456789012 | From GCP Console |
| `WIF_PROVIDER` | projects/123456789012/locations/global/workloadIdentityPools/github-pool/providers/github-provider | From step 8 |
| `WIF_SERVICE_ACCOUNT` | ci-vertex@hustleapp-production.iam.gserviceaccount.com | From step 5 |
| `ORG_READ_TOKEN` | ghp_xxxxxxxxxxxxx | GitHub PAT with repo:read |

---

## VERIFICATION

### 1. Test WIF Configuration
```bash
# List the pool
gcloud iam workload-identity-pools list \
  --location="global" \
  --project="${PROJECT_ID}"

# List providers
gcloud iam workload-identity-pools providers list \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --project="${PROJECT_ID}"

# Check service account
gcloud iam service-accounts describe \
  "ci-vertex@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}"
```

### 2. Verify IAM Bindings
```bash
# Check workload identity bindings
gcloud iam service-accounts get-iam-policy \
  "ci-vertex@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --format=json
```

### 3. Test in GitHub Actions
Use the dry_run workflow to verify authentication:
```yaml
- name: Test WIF Authentication
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
```

---

## SECURITY NOTES

### What WIF Prevents
- ❌ No service account keys in repository
- ❌ No long-lived credentials
- ❌ No key rotation required
- ❌ No accidental key exposure

### What WIF Provides
- ✅ Short-lived tokens (1 hour max)
- ✅ Repository-scoped access
- ✅ Audit logging via Cloud Audit Logs
- ✅ Automatic token management

### Restrictions
- Only the specified repository can authenticate
- Only from GitHub Actions runners
- Only with proper OIDC token
- Organization-level restriction via attribute condition

---

## TROUBLESHOOTING

### Common Issues

1. **"Permission denied" in GitHub Actions**
   - Verify PROJECT_NUMBER is correct
   - Check repository path matches exactly
   - Ensure APIs are enabled

2. **"Unable to acquire impersonation token"**
   - Check workloadIdentityUser binding
   - Verify pool and provider names
   - Confirm service account exists

3. **"API not enabled" errors**
   - Run the enable APIs command again
   - Check billing is enabled
   - Wait 2-3 minutes for propagation

### Debug Commands
```bash
# Check current authentication
gcloud auth list

# Validate project
gcloud config get-value project

# Test Vertex AI access
gcloud ai models list --region=us-central1

# Check storage access
gsutil ls gs://${PROJECT_ID}-media/
```

---

## CLEANUP (If Needed)

To remove WIF configuration:
```bash
# Delete service account
gcloud iam service-accounts delete \
  "ci-vertex@${PROJECT_ID}.iam.gserviceaccount.com" \
  --quiet \
  --project="${PROJECT_ID}"

# Delete provider
gcloud iam workload-identity-pools providers delete "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --quiet \
  --project="${PROJECT_ID}"

# Delete pool
gcloud iam workload-identity-pools delete "github-pool" \
  --location="global" \
  --quiet \
  --project="${PROJECT_ID}"
```

---

**Setup Date:** 2025-11-08
**Status:** Ready for Execution
**Note:** Keys prohibited - OIDC only

**END OF WIF SETUP DOCUMENTATION**