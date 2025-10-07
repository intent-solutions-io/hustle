#!/bin/bash

###############################################################################
# Google Secret Manager Setup
# Purpose: Store production secrets in Secret Manager
# Usage: ./setup-secrets.sh
###############################################################################

set -e

PROJECT_ID="hustle-dev-202510"
CLOUDRUN_SA="hustle-cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "════════════════════════════════════════════════════════════"
echo "Google Secret Manager Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Function to create or update secret
create_or_update_secret() {
  local secret_name=$1
  local secret_value=$2

  # Check if secret exists
  if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
    echo "📝 Secret '$secret_name' already exists, creating new version..."
    echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
      --data-file=- \
      --project="$PROJECT_ID"
    echo "✅ Secret '$secret_name' updated"
  else
    echo "📝 Creating secret: $secret_name"
    echo -n "$secret_value" | gcloud secrets create "$secret_name" \
      --data-file=- \
      --replication-policy="automatic" \
      --project="$PROJECT_ID"
    echo "✅ Secret '$secret_name' created"
  fi

  # Grant Cloud Run service account access
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:$CLOUDRUN_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" \
    --quiet

  echo "✅ Access granted to Cloud Run service account"
  echo ""
}

# Get DATABASE_URL from Terraform output
echo "🔍 Retrieving database password from Terraform..."
cd /home/jeremy/projects/hustle/06-Infrastructure/terraform

if [ -f ".creds/db_password.txt" ]; then
  DB_PASSWORD=$(cat .creds/db_password.txt)
  DATABASE_URL="postgresql://hustle_admin:${DB_PASSWORD}@10.240.0.3:5432/hustle_mvp"
  echo "✅ Database URL constructed"
else
  echo "❌ Database password not found at .creds/db_password.txt"
  echo "   Run 'terraform output db_connection_string' to get the connection string"
  exit 1
fi

cd /home/jeremy/projects/hustle

echo ""
echo "═══ Creating DATABASE_URL secret ═══"
create_or_update_secret "database-url" "$DATABASE_URL"

echo "═══ Creating NEXTAUTH_SECRET secret ═══"
echo "📝 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
create_or_update_secret "nextauth-secret" "$NEXTAUTH_SECRET"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ SECRET MANAGER SETUP COMPLETE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Secrets created:"
echo "  - database-url"
echo "  - nextauth-secret"
echo ""
echo "🔐 All secrets are accessible by:"
echo "  - Service Account: $CLOUDRUN_SA"
echo ""
echo "📝 Your NEXTAUTH_SECRET (save this for local development):"
echo "$NEXTAUTH_SECRET"
echo ""
echo "💡 Add to your .env.local:"
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
