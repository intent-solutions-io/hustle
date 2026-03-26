# ==============================================================================
# Projects Module Variables
# ==============================================================================

variable "organization_id" {
  description = "GCP Organization ID"
  type        = string
}

variable "billing_account" {
  description = "GCP Billing Account ID"
  type        = string
}

variable "project_prefix" {
  description = "Prefix for all project names"
  type        = string
  default     = "hustleapp"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}
