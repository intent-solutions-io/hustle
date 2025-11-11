#!/bin/bash
# Setup GCP resources for Veo proxy

set -euo pipefail

PROJECT_ID="hustleapp-production"
REGION="us-central1"
SERVICE_NAME="veo-proxy"
SECRET_NAME="gemini-api-key"
SERVICE_ACCOUNT="${SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔧 Setting up GCP resources..."

# Create service account
echo "Creating service account..."
gcloud iam service-accounts create ${SERVICE_NAME} \
  --display-name="Veo Proxy Service Account" \
  --project=${PROJECT_ID} || echo "Service account already exists"

# Grant Secret Manager access
echo "Granting Secret Manager access..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Create secret (you need to add the actual API key)
echo ""
echo "⚠️  IMPORTANT: Add your Gemini API key to Secret Manager:"
echo ""
echo "1. Get your API key from: https://makersuite.google.com/app/apikey"
echo "2. Run this command with your actual key:"
echo ""
echo "echo -n 'YOUR_API_KEY_HERE' | gcloud secrets create ${SECRET_NAME} \\"
echo "  --data-file=- \\"
echo "  --replication-policy=automatic \\"
echo "  --project=${PROJECT_ID}"
echo ""
echo "3. Then run deploy.sh to deploy the service"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  --project=${PROJECT_ID}

echo "✅ Setup complete!"