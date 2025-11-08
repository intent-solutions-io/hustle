# ==============================================================================
# Cloud Run Module - Serverless Container Services
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
# Enable Cloud Run API
# ==============================================================================

resource "google_project_service" "cloudrun_api" {
  project            = var.project_id
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# Cloud Run Services
# ==============================================================================

resource "google_cloud_run_service" "services" {
  for_each = var.services

  project  = var.project_id
  name     = each.key
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"        = lookup(each.value, "max_scale", "10")
        "autoscaling.knative.dev/minScale"        = lookup(each.value, "min_scale", "0")
        "run.googleapis.com/vpc-access-connector" = var.vpc_connector_id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }

    spec {
      containers {
        image = each.value.image

        ports {
          container_port = lookup(each.value, "port", 8080)
        }

        resources {
          limits = {
            cpu    = lookup(each.value, "cpu", "1000m")
            memory = lookup(each.value, "memory", "512Mi")
          }
        }

        # Regular environment variables
        dynamic "env" {
          for_each = lookup(each.value, "env_vars", {})
          content {
            name  = env.key
            value = env.value
          }
        }

        # Secret environment variables (from Secret Manager)
        dynamic "env" {
          for_each = lookup(each.value, "secret_env_vars", {})
          content {
            name = env.key
            value_from {
              secret_key_ref {
                name = env.value
                key  = "latest"
              }
            }
          }
        }
      }

      service_account_name = lookup(each.value, "service_account", null)
      timeout_seconds      = lookup(each.value, "timeout", 60)
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.cloudrun_api]
}

# ==============================================================================
# IAM Policy - Allow Public Access (Optional)
# ==============================================================================

resource "google_cloud_run_service_iam_member" "public_access" {
  for_each = {
    for key, service in var.services : key => service
    if lookup(service, "allow_public", false)
  }

  project  = var.project_id
  service  = google_cloud_run_service.services[each.key].name
  location = google_cloud_run_service.services[each.key].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
