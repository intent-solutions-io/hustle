# ==============================================================================
# Cloud SQL Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for Cloud SQL"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud SQL instance"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "database_name" {
  description = "Name of the Cloud SQL instance and database"
  type        = string
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "postgres_tier" {
  description = "Cloud SQL machine type"
  type        = string
  default     = "db-g1-small"
}

variable "disk_type" {
  description = "Disk type (PD_SSD or PD_HDD)"
  type        = string
  default     = "PD_HDD"
}

variable "disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 10
}

variable "high_availability" {
  description = "Enable high availability (REGIONAL vs ZONAL)"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "backups_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "Backup start time (HH:MM format)"
  type        = string
  default     = "03:00"
}

variable "pitr_enabled" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "transaction_log_retention_days" {
  description = "Transaction log retention days"
  type        = number
  default     = 7
}

variable "backup_retention_count" {
  description = "Number of backups to retain"
  type        = number
  default     = 30
}

variable "max_connections" {
  description = "Maximum database connections"
  type        = string
  default     = "100"
}

variable "vpc_id" {
  description = "VPC network ID for private IP"
  type        = string
}

variable "vpc_peering_dependency" {
  description = "VPC peering connection dependency"
  type        = any
  default     = null
}

variable "db_user" {
  description = "Database user name"
  type        = string
  default     = "hustle_admin"
}
