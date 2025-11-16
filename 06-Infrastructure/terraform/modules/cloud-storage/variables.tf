# ==============================================================================
# Cloud Storage Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for Cloud Storage"
  type        = string
}

variable "region" {
  description = "Default region for buckets"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "buckets" {
  description = "Map of bucket configurations"
  type = map(object({
    name                    = string
    storage_class           = string
    versioning_enabled      = optional(bool, false)
    public_read             = optional(bool, false)
    cors_enabled            = optional(bool, false)
    cors_origins            = optional(list(string), ["*"])
    cors_methods            = optional(list(string), ["GET", "HEAD", "PUT", "POST", "DELETE"])
    cors_response_headers   = optional(list(string), ["*"])
    cors_max_age            = optional(number, 3600)
    lifecycle_rules         = optional(list(object({
      action = object({
        type = string
      })
      condition = object({
        age                   = optional(number)
        created_before        = optional(string)
        num_newer_versions    = optional(number)
        matches_storage_class = optional(list(string))
      })
    })), [])
  }))
  default = {}
}
