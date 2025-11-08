# ==============================================================================
# Firebase Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for Firebase"
  type        = string
}

variable "firebase_location" {
  description = "Firebase/Firestore location"
  type        = string
  default     = "us-central"
}

variable "site_id" {
  description = "Firebase Hosting site ID"
  type        = string
  default     = "hustle-app"
}
