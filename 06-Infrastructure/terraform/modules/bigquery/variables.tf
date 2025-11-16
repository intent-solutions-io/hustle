# ==============================================================================
# BigQuery Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for BigQuery"
  type        = string
}

variable "location" {
  description = "BigQuery dataset location"
  type        = string
  default     = "US"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "datasets" {
  description = "Map of dataset configurations"
  type = map(object({
    dataset_id                      = string
    description                     = string
    default_table_expiration_days   = optional(number)
    tables = optional(map(object({
      schema      = string
      description = optional(string, "")
    })), {})
  }))
  default = {}
}
