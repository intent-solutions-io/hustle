# ==============================================================================
# Firestore Module - Firestore Database Setup
# ==============================================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }
}

# ==============================================================================
# Enable Firestore API
# ==============================================================================

resource "google_project_service" "firestore_api" {
  project            = var.project_id
  service            = "firestore.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# Firestore Database
# ==============================================================================

resource "google_firestore_database" "default" {
  provider = google-beta
  project  = var.project_id
  name     = "(default)"

  # Native mode for full Firestore features
  type = "FIRESTORE_NATIVE"

  # Location for Firestore
  location_id = var.location

  # Concurrency mode (optimistic is default)
  concurrency_mode = "OPTIMISTIC"

  # App Engine integration mode (DISABLED for new projects)
  app_engine_integration_mode = "DISABLED"

  depends_on = [google_project_service.firestore_api]
}

# ==============================================================================
# Firestore Indexes (for common queries)
# ==============================================================================

# Index for agent conversations by user and timestamp
resource "google_firestore_index" "agent_conversations" {
  provider = google-beta
  project  = var.project_id
  database = google_firestore_database.default.name

  collection = "agent_conversations"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.default]
}

# Index for diagnostic submissions by user and status
resource "google_firestore_index" "diagnostic_submissions" {
  provider = google-beta
  project  = var.project_id
  database = google_firestore_database.default.name

  collection = "diagnosticSubmissions"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.default]
}
