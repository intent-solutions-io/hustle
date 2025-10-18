# Hustle MVP - Cloud Run Services
# Production and Staging deployments

# Enable Cloud Run API
resource "google_project_service" "cloudrun" {
  project = var.project_id
  service = "run.googleapis.com"

  disable_on_destroy = false
}

# Serverless VPC Access Connector (for Cloud SQL private IP access)
resource "google_vpc_access_connector" "connector" {
  name          = "hustle-vpc-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28" # /28 for cost optimization (16 IPs)

  min_instances = 2
  max_instances = 3

  depends_on = [google_project_service.cloudrun]
}

# Cloud Run Service - Production
resource "google_cloud_run_service" "hustle_app" {
  name     = "hustle-app"
  location = var.region
  project  = var.project_id

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"        = "10"
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }

    spec {
      containers {
        image = "gcr.io/${var.project_id}/hustle-app:latest" # Placeholder - update via CI/CD

        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "PORT"
          value = "8080"
        }

        env {
          name  = "NEXTAUTH_URL"
          value = "https://hustlestats.io"
        }

        # Secrets from Secret Manager
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "NEXTAUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.nextauth_secret.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "SENTRY_DSN"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.sentry_dsn.secret_id
              key  = "latest"
            }
          }
        }
      }

      service_account_name = "${var.project_id}@appspot.gserviceaccount.com"
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.cloudrun,
    google_vpc_access_connector.connector,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.nextauth_secret
  ]
}

# Cloud Run Service - Staging
resource "google_cloud_run_service" "hustle_app_staging" {
  name     = "hustle-app-staging"
  location = var.region
  project  = var.project_id

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"        = "3" # Lower for staging
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }

    spec {
      containers {
        image = "gcr.io/${var.project_id}/hustle-app:staging" # Placeholder

        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "staging"
        }

        env {
          name  = "PORT"
          value = "8080"
        }

        env {
          name  = "NEXTAUTH_URL"
          value = "https://staging-hustlestats.io" # Update with actual staging domain
        }

        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "NEXTAUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.nextauth_secret.secret_id
              key  = "latest"
            }
          }
        }
      }

      service_account_name = "${var.project_id}@appspot.gserviceaccount.com"
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.cloudrun,
    google_vpc_access_connector.connector
  ]
}

# Allow unauthenticated access (public)
resource "google_cloud_run_service_iam_member" "noauth_prod" {
  service  = google_cloud_run_service.hustle_app.name
  location = google_cloud_run_service.hustle_app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "noauth_staging" {
  service  = google_cloud_run_service.hustle_app_staging.name
  location = google_cloud_run_service.hustle_app_staging.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "cloudrun_url_prod" {
  description = "Cloud Run service URL (production)"
  value       = google_cloud_run_service.hustle_app.status[0].url
}

output "cloudrun_url_staging" {
  description = "Cloud Run service URL (staging)"
  value       = google_cloud_run_service.hustle_app_staging.status[0].url
}

output "deployment_commands" {
  description = "Commands to deploy to Cloud Run"
  value       = <<-EOT
    # Deploy to production:
    gcloud run deploy hustle-app --source . --region ${var.region}

    # Deploy to staging:
    gcloud run deploy hustle-app-staging --source . --region ${var.region}
  EOT
}
