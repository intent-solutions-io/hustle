# ==============================================================================
# Vertex AI Agent Module Variables
# ==============================================================================

variable "project_id" {
  description = "GCP project ID for Vertex AI Agent"
  type        = string
}

variable "region" {
  description = "GCP region for Vertex AI Agent"
  type        = string
  default     = "us-central1"
}

variable "agent_name" {
  description = "Unique identifier for the agent"
  type        = string
}

variable "display_name" {
  description = "Display name for the agent"
  type        = string
}

variable "gemini_model" {
  description = "Gemini model version to use"
  type        = string
  default     = "gemini-2.0-flash-001"
}

variable "system_instruction" {
  description = "System instruction (prompt) for the agent"
  type        = string
  default     = "You are a helpful AI assistant."
}

variable "datastore_id" {
  description = "Vertex AI Search datastore ID for RAG (optional)"
  type        = string
  default     = null
}

variable "tools" {
  description = "List of tool configurations for the agent"
  type = list(object({
    name        = string
    description = string
    webhook_url = string
    parameters  = map(object({
      type     = string
      required = bool
    }))
  }))
  default = []
}
