# ==============================================================================
# Cloud Run Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for Cloud Run"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run services"
  type        = string
  default     = "us-central1"
}

variable "vpc_connector_id" {
  description = "VPC connector ID for private network access"
  type        = string
}

variable "services" {
  description = "Map of Cloud Run service configurations"
  type = map(object({
    image             = string
    port              = optional(number, 8080)
    cpu               = optional(string, "1000m")
    memory            = optional(string, "512Mi")
    timeout           = optional(number, 60)
    min_scale         = optional(string, "0")
    max_scale         = optional(string, "10")
    allow_public      = optional(bool, false)
    service_account   = optional(string)
    env_vars          = optional(map(string), {})
    secret_env_vars   = optional(map(string), {})
  }))
  default = {}
}
