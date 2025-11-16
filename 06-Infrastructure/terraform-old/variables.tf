# Hustle MVP - Variable Definitions
# All configurable values for cost-optimized infrastructure

# Project Configuration
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "hustle-dev-202510"
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone for resources"
  type        = string
  default     = "us-central1-a"
}

# Network Configuration
variable "vpc_name" {
  description = "Name of the VPC network"
  type        = string
  default     = "hustle-vpc"
}

variable "subnet_name" {
  description = "Name of the subnet"
  type        = string
  default     = "hustle-public-subnet"
}

variable "subnet_cidr" {
  description = "CIDR range for the subnet"
  type        = string
  default     = "10.10.1.0/24"
}

# Compute Configuration
variable "vm_name" {
  description = "Name of the web server VM"
  type        = string
  default     = "hustle-web-server"
}

variable "vm_machine_type" {
  description = "Machine type for web server (cost-optimized)"
  type        = string
  default     = "e2-micro"
}

variable "vm_image" {
  description = "Boot disk image for VM"
  type        = string
  default     = "debian-cloud/debian-12"
}

variable "vm_disk_size" {
  description = "Boot disk size in GB"
  type        = number
  default     = 10
}

# Database Configuration
variable "db_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "hustle-db"
}

variable "db_tier" {
  description = "Database tier (cost-optimized)"
  type        = string
  default     = "db-g1-small"
}

variable "db_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "hustle_mvp"
}

variable "db_user" {
  description = "Database user name"
  type        = string
  default     = "hustle_admin"
}

# Storage Configuration
variable "bucket_name" {
  description = "GCS bucket name for media uploads"
  type        = string
  default     = "hustle-mvp-media"
}

variable "bucket_location" {
  description = "GCS bucket location"
  type        = string
  default     = "US"
}

variable "bucket_storage_class" {
  description = "Storage class for cost optimization"
  type        = string
  default     = "STANDARD"
}

# Environment Tags
variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "development"
}

variable "project_name" {
  description = "Project name for resource labeling"
  type        = string
  default     = "hustle-mvp"
}
