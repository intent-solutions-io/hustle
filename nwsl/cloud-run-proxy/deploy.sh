#!/bin/bash
# Deploy Veo proxy to Cloud Run

set -euo pipefail

PROJECT_ID="hustleapp-production"
REGION="us-central1"
SERVICE_NAME="veo-proxy"
SECRET_NAME="gemini-api-key"

echo "🚀 Deploying Veo proxy to Cloud Run..."

# Build and push container
echo "Building container..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME} .

# Deploy to Cloud Run (private, requires authentication)
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --region ${REGION} \
  --platform managed \
  --no-allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},API_KEY_SECRET=${SECRET_NAME}" \
  --service-account "${SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --memory 512Mi \
  --timeout 1800 \
  --max-instances 10 \
  --concurrency 10

echo "✅ Deployment complete!"

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --format 'value(status.url)')

echo "Service URL: ${SERVICE_URL}"
echo ""
echo "To test locally with ID token:"
echo "ID_TOKEN=\$(gcloud auth print-identity-token --audiences=\"${SERVICE_URL}\")"
echo "curl -H \"Authorization: Bearer \$ID_TOKEN\" ${SERVICE_URL}/health"