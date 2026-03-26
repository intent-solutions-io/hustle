# Hustle MVP - Database Configuration
# Cost-optimized Cloud SQL PostgreSQL (db-g1-small, no HA)

# Generate random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = var.db_name
  database_version = var.db_version
  region           = var.region
  project          = var.project_id

  # CRITICAL: Delete protection disabled for dev/testing
  deletion_protection = false

  settings {
    tier = var.db_tier # db-g1-small for cost optimization

    # Cost-optimized configuration
    availability_type = "ZONAL"  # NO high availability (single zone)
    disk_type         = "PD_HDD" # Standard disk (cheaper than SSD)
    disk_size         = 10       # Minimum size in GB

    # Automated backups (PRODUCTION)
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00" # 3 AM UTC
      point_in_time_recovery_enabled = true    # Enable PITR
      transaction_log_retention_days = 7       # Keep transaction logs for 7 days
      backup_retention_settings {
        retained_backups = 30 # Keep 30 backups
        retention_unit   = "COUNT"
      }
    }

    # IP configuration - PRIVATE IP ONLY (no public IP)
    ip_configuration {
      ipv4_enabled                                  = false # No public IP
      private_network                               = google_compute_network.vpc.id
      enable_private_path_for_google_cloud_services = true

      require_ssl = true # SSL required for production
    }

    # Maintenance window (to avoid disruptions)
    maintenance_window {
      day          = 7 # Sunday
      hour         = 3 # 3 AM
      update_track = "stable"
    }

    # Database flags for optimization
    database_flags {
      name  = "max_connections"
      value = "100"
    }

    # Labels for cost tracking
    user_labels = {
      environment = var.environment
      project     = var.project_name
      managed_by  = "terraform"
    }
  }

  # Ensure VPC peering is set up first
  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Database within the instance
resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
  project  = var.project_id
}

# Database user
resource "google_sql_user" "user" {
  name     = var.db_user
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
  project  = var.project_id
}

# Store database password in a local file (for development only!)
# In production, use Secret Manager
resource "local_file" "db_password" {
  content  = random_password.db_password.result
  filename = "${path.module}/.creds/db_password.txt"

  file_permission = "0600"
}

# Output database connection string (sensitive)
output "db_connection_string" {
  description = "PostgreSQL connection string (sensitive)"
  value       = "postgresql://${var.db_user}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${var.database_name}"
  sensitive   = true
}
