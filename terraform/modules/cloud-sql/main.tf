# ==============================================================================
# Cloud SQL Module - PostgreSQL Database
# ==============================================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# ==============================================================================
# Enable Cloud SQL API
# ==============================================================================

resource "google_project_service" "sqladmin_api" {
  project            = var.project_id
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager_api" {
  project            = var.project_id
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# Generate Database Password
# ==============================================================================

resource "random_password" "db_password" {
  length  = 16
  special = true
}

# ==============================================================================
# Store Password in Secret Manager
# ==============================================================================

resource "google_secret_manager_secret" "db_password" {
  project   = var.project_id
  secret_id = "${var.database_name}-db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# ==============================================================================
# Cloud SQL PostgreSQL Instance
# ==============================================================================

resource "google_sql_database_instance" "postgres" {
  project          = var.project_id
  name             = var.database_name
  database_version = var.postgres_version
  region           = var.region

  # Delete protection (enable for production)
  deletion_protection = var.deletion_protection

  settings {
    tier = var.postgres_tier

    # Availability and disk configuration
    availability_type = var.high_availability ? "REGIONAL" : "ZONAL"
    disk_type         = var.disk_type
    disk_size         = var.disk_size

    # Automated backups
    backup_configuration {
      enabled                        = var.backups_enabled
      start_time                     = var.backup_start_time
      point_in_time_recovery_enabled = var.pitr_enabled
      transaction_log_retention_days = var.transaction_log_retention_days
      backup_retention_settings {
        retained_backups = var.backup_retention_count
        retention_unit   = "COUNT"
      }
    }

    # IP configuration - Private IP only
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.vpc_id
      enable_private_path_for_google_cloud_services = true
      require_ssl                                   = true
    }

    # Maintenance window
    maintenance_window {
      day          = 7  # Sunday
      hour         = 3  # 3 AM
      update_track = "stable"
    }

    # Database flags
    database_flags {
      name  = "max_connections"
      value = var.max_connections
    }

    # Labels
    user_labels = {
      environment = var.environment
      project     = "hustle"
      managed_by  = "terraform"
    }
  }

  # Ensure VPC peering is set up first
  depends_on = [
    google_project_service.sqladmin_api,
    var.vpc_peering_dependency
  ]
}

# ==============================================================================
# Database
# ==============================================================================

resource "google_sql_database" "database" {
  project  = var.project_id
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
}

# ==============================================================================
# Database User
# ==============================================================================

resource "google_sql_user" "user" {
  project  = var.project_id
  name     = var.db_user
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}
