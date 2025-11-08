# ==============================================================================
# IAM Module Variables
# ==============================================================================

variable "frontend_project_id" {
  description = "Frontend project ID"
  type        = string
}

variable "data_project_id" {
  description = "Data project ID"
  type        = string
}

variable "agent_projects" {
  description = "Map of agent project IDs"
  type        = map(string)
  default     = {}
}
