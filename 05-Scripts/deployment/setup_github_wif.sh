#!/bin/bash
set -e

PROJECT_ID=hustleapp-production
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
POOL_NAME=github-actions-pool
PROVIDER_NAME=github-provider
SA_NAME=github-actions-sa
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
REPO_OWNER="jeremylongshorneintent"  # Update if different
REPO_NAME="hustle"

echo "=== Create Workload Identity Pool ==="
gcloud iam workload-identity-pools create $POOL_NAME \
  --location=global \
  --display-name="GitHub Actions Pool" \
  --project=$PROJECT_ID

echo "=== Create GitHub OIDC Provider ==="
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
  --location=global \
  --workload-identity-pool=$POOL_NAME \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner=='${REPO_OWNER}'" \
  --project=$PROJECT_ID

echo "=== Create Service Account ==="
gcloud iam service-accounts create $SA_NAME \
  --display-name="GitHub Actions Deployment" \
  --project=$PROJECT_ID

echo "=== Grant Service Account Permissions ==="
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

echo "=== Allow GitHub to impersonate Service Account ==="
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${REPO_OWNER}/${REPO_NAME}" \
  --project=$PROJECT_ID

echo ""
echo "=== GitHub Secrets Configuration ==="
echo ""
echo "WIF_PROVIDER:"
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
echo ""
echo "WIF_SERVICE_ACCOUNT:"
echo "${SA_EMAIL}"
echo ""
echo "Add these to GitHub repository secrets:"
echo "  WIF_PROVIDER = projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
echo "  WIF_SERVICE_ACCOUNT = ${SA_EMAIL}"
echo ""
