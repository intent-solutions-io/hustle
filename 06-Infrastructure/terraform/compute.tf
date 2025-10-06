# Hustle MVP - Cloud Run Service
# Serverless container deployment (no external IP issues, no load balancer needed)

# Note: This file configures the Cloud Run service infrastructure only.
# Actual application deployment happens via:
#   gcloud run deploy hustle-app --source . --region us-central1

# Cloud Run Service (placeholder - will be deployed via gcloud CLI)
# Terraform manages the IAM and networking, app code deployed separately

# Enable Cloud Run API if not already enabled
resource "google_project_service" "run" {
  project = var.project_id
  service = "run.googleapis.com"

  disable_on_destroy = false
}

# VPC Connector for Cloud Run to access Cloud SQL via private IP
resource "google_vpc_access_connector" "connector" {
  name          = "hustle-vpc-connector"
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28" # Small /28 range for connector

  depends_on = [
    google_compute_network.vpc,
    google_project_service.run
  ]
}

# Output for Cloud Run deployment
output "cloud_run_deployment_command" {
  description = "Command to deploy Cloud Run service"
  value       = <<-EOT
    # Deploy Next.js app to Cloud Run:
    gcloud run deploy hustle-app \
      --source . \
      --region ${var.region} \
      --platform managed \
      --allow-unauthenticated \
      --vpc-connector ${google_vpc_access_connector.connector.name} \
      --set-env-vars "DATABASE_URL=postgresql://${var.db_user}:PASSWORD_FROM_CREDS@${google_sql_database_instance.postgres.private_ip_address}:5432/${var.database_name}" \
      --set-env-vars "GCS_BUCKET=${google_storage_bucket.media.name}" \
      --set-env-vars "PROJECT_ID=${var.project_id}"
  EOT
}

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
