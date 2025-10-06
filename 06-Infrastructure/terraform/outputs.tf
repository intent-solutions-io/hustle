# Hustle MVP - Output Values
# Key information exported after infrastructure deployment

# Cloud Run Outputs
output "cloudrun_service_account_email" {
  description = "Service account email for Cloud Run (uses Workload Identity)"
  value       = google_service_account.cloudrun_sa.email
}

output "vpc_connector_name" {
  description = "VPC Connector for Cloud Run to access private resources"
  value       = google_vpc_access_connector.connector.name
}

output "vpc_connector_id" {
  description = "VPC Connector ID for Cloud Run deployment"
  value       = google_vpc_access_connector.connector.id
}

# Database Outputs
output "db_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.postgres.name
}

output "db_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "db_private_ip" {
  description = "Private IP address of Cloud SQL instance"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "database_name" {
  description = "Name of the created database"
  value       = google_sql_database.database.name
}

# Storage Outputs
output "media_bucket_name" {
  description = "Name of the GCS bucket for media uploads"
  value       = google_storage_bucket.media.name
}

output "media_bucket_url" {
  description = "URL of the GCS bucket"
  value       = google_storage_bucket.media.url
}

output "media_bucket_self_link" {
  description = "Self-link of the GCS bucket"
  value       = google_storage_bucket.media.self_link
}

# Network Outputs
output "vpc_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = google_compute_subnetwork.subnet.name
}

output "subnet_cidr" {
  description = "CIDR range of the subnet"
  value       = google_compute_subnetwork.subnet.ip_cidr_range
}

# Connection Information (for application config)
output "connection_info" {
  description = "Quick reference for connecting to infrastructure"
  value = {
    service_account   = google_service_account.cloudrun_sa.email
    vpc_connector     = google_vpc_access_connector.connector.name
    db_private_ip     = google_sql_database_instance.postgres.private_ip_address
    db_connection     = google_sql_database_instance.postgres.connection_name
    media_bucket      = google_storage_bucket.media.name
    vpc_network       = google_compute_network.vpc.name
  }
}
