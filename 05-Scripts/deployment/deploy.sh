#!/bin/bash

###############################################################################
# Hustle - Manual Deployment Script
# Purpose: Deploy application to Cloud Run
# Usage: ./deploy.sh
###############################################################################

set -e

PROJECT_ID="hustle-dev-202510"
REGION="us-central1"
SERVICE_NAME="hustle-app"
SERVICE_URL="https://hustle-app-158864638007.us-central1.run.app"

echo "════════════════════════════════════════════════════════════"
echo "Hustle - Cloud Run Deployment"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📦 Service: $SERVICE_NAME"
echo "🌍 Region: $REGION"
echo "🔗 URL: $SERVICE_URL"
echo ""
echo "⏳ Starting deployment..."
echo ""

# Deploy to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --vpc-connector=hustle-vpc-connector \
  --service-account=hustle-cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --update-secrets="DATABASE_URL=database-url:latest,NEXTAUTH_SECRET=nextauth-secret:latest" \
  --set-env-vars="NEXTAUTH_URL=${SERVICE_URL},NODE_ENV=production" \
  --max-instances=10 \
  --min-instances=0 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80 \
  --project="$PROJECT_ID"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Live URL: $SERVICE_URL"
echo ""
echo "🔍 Testing health check..."
sleep 10

if curl -f "${SERVICE_URL}/api/healthcheck" 2>/dev/null; then
  echo ""
  echo "✅ Health check PASSED"
  echo ""
  echo "🚀 Your app is live and healthy!"
else
  echo ""
  echo "⚠️  Health check failed (service may still be starting)"
  echo "   Try again in 30 seconds: curl ${SERVICE_URL}/api/healthcheck"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
