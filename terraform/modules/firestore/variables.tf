# ==============================================================================
# Firestore Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for Firestore"
  type        = string
}

variable "location" {
  description = "Firestore location"
  type        = string
  default     = "us-central"
}
