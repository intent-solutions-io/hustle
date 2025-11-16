# Hustle MVP - Secret Manager Configuration
# Secure storage for sensitive configuration values

# Enable Secret Manager API
resource "google_project_service" "secret_manager" {
  project = var.project_id
  service = "secretmanager.googleapis.com"

  disable_on_destroy = false
}

# DATABASE_URL Secret
resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${var.db_user}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${var.database_name}?sslmode=require"
}

# NEXTAUTH_SECRET Secret
resource "random_password" "nextauth_secret" {
  length  = 32
  special = true
}

resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "NEXTAUTH_SECRET"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = random_password.nextauth_secret.result
}

# SENTRY_DSN Secret (placeholder - update manually)
resource "google_secret_manager_secret" "sentry_dsn" {
  secret_id = "SENTRY_DSN"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret_version" "sentry_dsn" {
  secret      = google_secret_manager_secret.sentry_dsn.id
  secret_data = "https://placeholder@sentry.io/placeholder" # Update with real DSN
}

# MAILER_KEY Secret (placeholder - update manually)
resource "google_secret_manager_secret" "mailer_key" {
  secret_id = "MAILER_KEY"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret_version" "mailer_key" {
  secret      = google_secret_manager_secret.mailer_key.id
  secret_data = "placeholder_mailer_key" # Update with real key
}

# IAM binding to allow Cloud Run to access secrets
resource "google_secret_manager_secret_iam_member" "database_url_accessor" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.project_id}@appspot.gserviceaccount.com" # Default compute service account
}

resource "google_secret_manager_secret_iam_member" "nextauth_secret_accessor" {
  secret_id = google_secret_manager_secret.nextauth_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.project_id}@appspot.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "sentry_dsn_accessor" {
  secret_id = google_secret_manager_secret.sentry_dsn.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.project_id}@appspot.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "mailer_key_accessor" {
  secret_id = google_secret_manager_secret.mailer_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.project_id}@appspot.gserviceaccount.com"
}

# Outputs
output "secret_instructions" {
  description = "Instructions for accessing secrets"
  value       = <<-EOT
    Secrets created in Secret Manager:
    - DATABASE_URL (auto-populated)
    - NEXTAUTH_SECRET (auto-generated)
    - SENTRY_DSN (placeholder - update manually)
    - MAILER_KEY (placeholder - update manually)

    Access secrets:
    gcloud secrets versions access latest --secret=DATABASE_URL

    Update placeholder secrets:
    echo -n "YOUR_ACTUAL_VALUE" | gcloud secrets versions add SENTRY_DSN --data-file=-
  EOT
}
