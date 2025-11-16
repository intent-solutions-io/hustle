# Hustle MVP - Cloud Run Service
# Serverless container deployment (no external IP issues, no load balancer needed)

# Note: This file configures the Cloud Run service infrastructure only.
# Actual application deployment happens via:
#   gcloud run deploy hustle-app --source . --region us-central1

# Cloud Run Service (placeholder - will be deployed via gcloud CLI)
# Terraform manages the IAM and networking, app code deployed separately

# Note: VPC Connector is defined in cloudrun.tf to avoid duplication
# Enable Cloud Run API if not already enabled
resource "google_project_service" "run" {
  project = var.project_id
  service = "run.googleapis.com"

  disable_on_destroy = false
}

# Note: Cloud Run deployment commands are now in cloudrun.tf outputs

# Service account for Cloud Run (uses Workload Identity instead of keys)
resource "google_service_account" "cloudrun_sa" {
  account_id   = "hustle-cloudrun-sa"
  display_name = "Hustle Cloud Run Service Account"
  description  = "Service account for Cloud Run to access Cloud SQL and GCS"
  project      = var.project_id
}

# Grant Cloud SQL Client role
resource "google_project_iam_member" "cloudrun_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# Grant Storage Object Admin role
resource "google_project_iam_member" "cloudrun_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# Output service account email
output "cloudrun_service_account" {
  description = "Service account email for Cloud Run"
  value       = google_service_account.cloudrun_sa.email
}
