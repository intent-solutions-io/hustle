# ==============================================================================
# IAM Module - Service Accounts & Permissions
# ==============================================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

# ==============================================================================
# Enable IAM API
# ==============================================================================

resource "google_project_service" "iam_api" {
  for_each = toset([
    var.frontend_project_id,
    var.data_project_id,
  ])

  project            = each.key
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# Service Accounts
# ==============================================================================

# Frontend Service Account (for Next.js app)
resource "google_service_account" "frontend" {
  project      = var.frontend_project_id
  account_id   = "frontend-app-sa"
  display_name = "Frontend Application Service Account"
  description  = "Service account for Next.js frontend application"

  depends_on = [google_project_service.iam_api]
}

# Data Access Service Account (for agents accessing BigQuery/Cloud SQL)
resource "google_service_account" "data_access" {
  project      = var.data_project_id
  account_id   = "data-access-sa"
  display_name = "Data Access Service Account"
  description  = "Service account for agents to access data layer"

  depends_on = [google_project_service.iam_api]
}

# Agent Service Accounts (one per agent project)
resource "google_service_account" "agents" {
  for_each = var.agent_projects

  project      = each.value
  account_id   = "${each.key}-agent-sa"
  display_name = "${each.key} Agent Service Account"
  description  = "Service account for ${each.key} agent"

  depends_on = [google_project_service.iam_api]
}

# ==============================================================================
# IAM Bindings - Frontend Project
# ==============================================================================

# Frontend SA can access Firestore
resource "google_project_iam_member" "frontend_firestore" {
  project = var.frontend_project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}

# Frontend SA can access Cloud Storage
resource "google_project_iam_member" "frontend_storage" {
  project = var.frontend_project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}

# ==============================================================================
# IAM Bindings - Data Project
# ==============================================================================

# Data Access SA can query BigQuery
resource "google_project_iam_member" "data_bigquery_reader" {
  project = var.data_project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.data_access.email}"
}

resource "google_project_iam_member" "data_bigquery_job_user" {
  project = var.data_project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.data_access.email}"
}

# Data Access SA can connect to Cloud SQL
resource "google_project_iam_member" "data_cloudsql_client" {
  project = var.data_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.data_access.email}"
}

# ==============================================================================
# IAM Bindings - Cross-Project Agent Access
# ==============================================================================

# Each agent SA can access data project (read-only)
resource "google_project_iam_member" "agents_data_access_bigquery" {
  for_each = var.agent_projects

  project = var.data_project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.agents[each.key].email}"
}

resource "google_project_iam_member" "agents_data_access_sql" {
  for_each = var.agent_projects

  project = var.data_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.agents[each.key].email}"
}

# Frontend SA can invoke agent endpoints
resource "google_project_iam_member" "frontend_invoke_agents" {
  for_each = var.agent_projects

  project = each.value
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}

# ==============================================================================
# Secret Manager Access (for Cloud Run services)
# ==============================================================================

# Frontend SA can access secrets in frontend project
resource "google_project_iam_member" "frontend_secrets" {
  project = var.frontend_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}

# Data Access SA can access secrets in data project
resource "google_project_iam_member" "data_secrets" {
  project = var.data_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.data_access.email}"
}

# Agent SAs can access secrets in their respective projects
resource "google_project_iam_member" "agents_secrets" {
  for_each = var.agent_projects

  project = each.value
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.agents[each.key].email}"
}
