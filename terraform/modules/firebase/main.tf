# ==============================================================================
# Firebase Module - Firebase Hosting Setup
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
# Firebase Project (Links existing GCP project to Firebase)
# ==============================================================================

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id

  depends_on = [
    google_project_service.firebase_apis
  ]
}

# ==============================================================================
# Enable Firebase APIs
# ==============================================================================

resource "google_project_service" "firebase_apis" {
  for_each = toset([
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# ==============================================================================
# Firebase Hosting Site
# ==============================================================================

resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.site_id

  depends_on = [
    google_firebase_project.default
  ]
}

# ==============================================================================
# Firebase Hosting Release (initial empty release)
# ==============================================================================

# Note: Actual deployments will be done via Firebase CLI or GitHub Actions
# This creates the hosting site structure only
