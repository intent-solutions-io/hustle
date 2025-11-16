# ==============================================================================
# VPC Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for VPC"
  type        = string
}

variable "region" {
  description = "GCP region for subnet"
  type        = string
  default     = "us-central1"
}

variable "vpc_name" {
  description = "Name of the VPC network"
  type        = string
  default     = "hustle-vpc"
}

variable "subnet_name" {
  description = "Name of the subnet"
  type        = string
  default     = "hustle-subnet"
}

variable "subnet_cidr" {
  description = "CIDR range for the subnet"
  type        = string
  default     = "10.10.1.0/24"
}

variable "connector_cidr" {
  description = "CIDR range for VPC connector (serverless)"
  type        = string
  default     = "10.8.0.0/28"
}
