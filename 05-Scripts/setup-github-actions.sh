#!/bin/bash

###############################################################################
# GitHub Actions - GCP Service Account Setup
# Purpose: Create service account for GitHub Actions to deploy to Cloud Run
# Usage: ./setup-github-actions.sh
###############################################################################

set -e

PROJECT_ID="hustle-dev-202510"
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

echo "════════════════════════════════════════════════════════════"
echo "GitHub Actions - GCP Service Account Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if service account exists
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  echo "✅ Service account already exists: $SA_EMAIL"
else
  echo "📝 Creating service account: $SA_EMAIL"
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="GitHub Actions Deployment" \
    --description="Service account for GitHub Actions to deploy to Cloud Run" \
    --project="$PROJECT_ID"
  echo "✅ Service account created"
fi

echo ""
echo "🔐 Granting IAM permissions..."

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin" \
  --condition=None \
  --quiet

# Grant Storage Admin role (for Artifact Registry)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin" \
  --condition=None \
  --quiet

# Grant Service Account User role (to deploy as Cloud Run SA)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None \
  --quiet

# Grant Secret Manager Secret Accessor (to read secrets)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None \
  --quiet

echo "✅ IAM permissions granted"

echo ""
echo "🔑 Creating service account key..."

# Delete existing key file if it exists
if [ -f "$KEY_FILE" ]; then
  echo "⚠️  Deleting existing key file: $KEY_FILE"
  rm "$KEY_FILE"
fi

# Create new key
gcloud iam service-accounts keys create "$KEY_FILE" \
  --iam-account="$SA_EMAIL" \
  --project="$PROJECT_ID"

echo "✅ Service account key created: $KEY_FILE"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Copy the service account key:"
echo "   cat $KEY_FILE"
echo ""
echo "2. Go to your GitHub repository:"
echo "   Settings → Secrets and variables → Actions"
echo ""
echo "3. Click 'New repository secret'"
echo "   Name: GCP_SA_KEY"
echo "   Value: [Paste entire JSON content from step 1]"
echo ""
echo "4. Save the secret"
echo ""
echo "5. Test deployment:"
echo "   git add ."
echo "   git commit -m 'test: trigger deployment'"
echo "   git push origin main"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🔐 IMPORTANT: Keep $KEY_FILE secure!"
echo "   This file contains sensitive credentials."
echo "   It is already in .gitignore and will not be committed."
echo ""
