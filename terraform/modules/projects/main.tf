# ==============================================================================
# GCP Projects Module - Creates All 7 Hustle Projects
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
# Project Creation
# ==============================================================================

# Frontend Project - Firebase Hosting, Firestore, Cloud Storage
resource "google_project" "frontend" {
  name            = "${var.project_prefix}-frontend-${var.environment}"
  project_id      = "${var.project_prefix}-frontend-${var.environment}"
  billing_account = var.billing_account
  org_id          = var.organization_id

  labels = {
    environment = var.environment
    project     = "hustle"
    component   = "frontend"
    managed_by  = "terraform"
  }
}

# Data Project - BigQuery, Cloud SQL, VPC
resource "google_project" "data" {
  name            = "${var.project_prefix}-data-${var.environment}"
  project_id      = "${var.project_prefix}-data-${var.environment}"
  billing_account = var.billing_account
  org_id          = var.organization_id

  labels = {
    environment = var.environment
    project     = "hustle"
    component   = "data"
    managed_by  = "terraform"
  }
}

# Agent Project - Performance Coach
resource "google_project" "agent_coach" {
  name            = "${var.project_prefix}-agent-coach-${var.environment}"
  project_id      = "${var.project_prefix}-agent-coach-${var.environment}"
  billing_account = var.billing_account
  org_id          = var.organization_id

  labels = {
    environment = var.environment
    project     = "hustle"
    component   = "agent"
    agent_type  = "performance-coach"
    managed_by  = "terraform"
  }
}

# Agent Project - Stats Analyst
resource "google_project" "agent_analyst" {
  name            = "${var.project_prefix}-agent-analyst-${var.environment}"
  project_id      = "${var.project_prefix}-agent-analyst-${var.environment}"
  billing_account = var.billing_account
  org_id          = var.organization_id

  labels = {
    environment = var.environment
    project     = "hustle"
    component   = "agent"
    agent_type  = "stats-analyst"
    managed_by  = "terraform"
  }
}

# Agent Project - Game Logger
resource "google_project" "agent_logger" {
  name            = "${var.project_prefix}-agent-logger-${var.environment}"
  project_id      = "${var.project_prefix}-agent-logger-${var.environment}"
  billing_account = var.billing_account
  org_id          = var.organization_id

  labels = {
    environment = var.environment
    project     = "hustle"
    component   = "agent"
    agent_type  = "game-logger"
    managed_by  = "terraform"
  }
}

# Agent Project - Scout Report
resource "google_project" "agent_scout" {
  name            = "${var.project_prefix}-agent-scout-${var.environment}"
  project_id      = "${var.project_prefix}-agent-scout-${var.environment}"
  billing_account = var.billing_account
  org_id          = var.organization_id

  labels = {
    environment = var.environment
    project     = "hustle"
    component   = "agent"
    agent_type  = "scout-report"
    managed_by  = "terraform"
  }
}

# Agent Project - Verification
resource "google_project" "agent_verify" {
  name            = "${var.project_prefix}-agent-verify-${var.environment}"
  project_id      = "${var.project_prefix}-agent-verify-${var.environment}"
  billing_account = var.billing_account
  org_id          = var.organization_id

  labels = {
    environment = var.environment
    project     = "hustle"
    component   = "agent"
    agent_type  = "verification"
    managed_by  = "terraform"
  }
}

# ==============================================================================
# Enable Required APIs - Frontend Project
# ==============================================================================

resource "google_project_service" "frontend_apis" {
  for_each = toset([
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "storage-api.googleapis.com",
    "storage-component.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "iam.googleapis.com",
  ])

  project            = google_project.frontend.project_id
  service            = each.key
  disable_on_destroy = false

  depends_on = [google_project.frontend]
}

# ==============================================================================
# Enable Required APIs - Data Project
# ==============================================================================

resource "google_project_service" "data_apis" {
  for_each = toset([
    "bigquery.googleapis.com",
    "bigquerystorage.googleapis.com",
    "sqladmin.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "iam.googleapis.com",
  ])

  project            = google_project.data.project_id
  service            = each.key
  disable_on_destroy = false

  depends_on = [google_project.data]
}

# ==============================================================================
# Enable Required APIs - Agent Projects
# ==============================================================================

locals {
  agent_projects = {
    coach   = google_project.agent_coach.project_id
    analyst = google_project.agent_analyst.project_id
    logger  = google_project.agent_logger.project_id
    scout   = google_project.agent_scout.project_id
    verify  = google_project.agent_verify.project_id
  }

  agent_apis = [
    "aiplatform.googleapis.com",
    "discoveryengine.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "iam.googleapis.com",
  ]
}

resource "google_project_service" "agent_apis" {
  for_each = {
    for pair in flatten([
      for agent_key, project_id in local.agent_projects : [
        for api in local.agent_apis : {
          key        = "${agent_key}-${replace(api, ".", "-")}"
          project_id = project_id
          api        = api
        }
      ]
    ]) : pair.key => pair
  }

  project            = each.value.project_id
  service            = each.value.api
  disable_on_destroy = false

  depends_on = [
    google_project.agent_coach,
    google_project.agent_analyst,
    google_project.agent_logger,
    google_project.agent_scout,
    google_project.agent_verify,
  ]
}
