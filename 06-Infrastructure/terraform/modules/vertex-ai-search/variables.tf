# ==============================================================================
# Vertex AI Search Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for Vertex AI Search"
  type        = string
}

variable "datastore_id" {
  description = "Unique identifier for the datastore"
  type        = string
}

variable "display_name" {
  description = "Display name for the datastore"
  type        = string
}

variable "location" {
  description = "Location for the datastore (global recommended)"
  type        = string
  default     = "global"
}

variable "content_config" {
  description = "Content configuration (CONTENT_REQUIRED, NO_CONTENT, PUBLIC_WEBSITE)"
  type        = string
  default     = "CONTENT_REQUIRED"
}

variable "solution_types" {
  description = "Solution types for the datastore"
  type        = list(string)
  default     = ["SOLUTION_TYPE_SEARCH"]
}

variable "documents_bucket" {
  description = "Cloud Storage bucket for documents (optional)"
  type        = string
  default     = null
}

variable "create_search_engine" {
  description = "Whether to create a search engine"
  type        = bool
  default     = false
}

variable "search_tier" {
  description = "Search tier (SEARCH_TIER_STANDARD or SEARCH_TIER_ENTERPRISE)"
  type        = string
  default     = "SEARCH_TIER_STANDARD"
}
