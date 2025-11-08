# ==============================================================================
# Cloud Storage Module - Flexible Bucket Management
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
# Enable Cloud Storage API
# ==============================================================================

resource "google_project_service" "storage_api" {
  project            = var.project_id
  service            = "storage-api.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# Cloud Storage Buckets
# ==============================================================================

resource "google_storage_bucket" "buckets" {
  for_each = var.buckets

  project  = var.project_id
  name     = each.value.name
  location = var.region

  # Storage class (STANDARD, NEARLINE, COLDLINE, ARCHIVE)
  storage_class = each.value.storage_class

  # Uniform bucket-level access (recommended)
  uniform_bucket_level_access = true

  # Versioning
  versioning {
    enabled = lookup(each.value, "versioning_enabled", false)
  }

  # Lifecycle rules
  dynamic "lifecycle_rule" {
    for_each = lookup(each.value, "lifecycle_rules", [])
    content {
      action {
        type = lifecycle_rule.value.action.type
      }
      condition {
        age                   = lookup(lifecycle_rule.value.condition, "age", null)
        created_before        = lookup(lifecycle_rule.value.condition, "created_before", null)
        num_newer_versions    = lookup(lifecycle_rule.value.condition, "num_newer_versions", null)
        matches_storage_class = lookup(lifecycle_rule.value.condition, "matches_storage_class", null)
      }
    }
  }

  # CORS configuration
  dynamic "cors" {
    for_each = lookup(each.value, "cors_enabled", false) ? [1] : []
    content {
      origin          = lookup(each.value, "cors_origins", ["*"])
      method          = lookup(each.value, "cors_methods", ["GET", "HEAD", "PUT", "POST", "DELETE"])
      response_header = lookup(each.value, "cors_response_headers", ["*"])
      max_age_seconds = lookup(each.value, "cors_max_age", 3600)
    }
  }

  labels = {
    environment = var.environment
    project     = "hustle"
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.storage_api]
}

# ==============================================================================
# Public Access Prevention (Security)
# ==============================================================================

resource "google_storage_bucket_iam_binding" "public_access_prevention" {
  for_each = {
    for key, bucket in var.buckets : key => bucket
    if !lookup(bucket, "public_read", false)
  }

  bucket = google_storage_bucket.buckets[each.key].name
  role   = "roles/storage.objectViewer"

  members = [
    "allUsers",
  ]

  # This binding is intentionally empty to prevent public access
  # Only add members when public_read = true
  condition {
    title       = "never"
    description = "Never allow public access"
    expression  = "false"
  }
}
