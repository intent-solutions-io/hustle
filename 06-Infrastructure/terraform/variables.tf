# ==============================================================================
# Global Variables for Hustle Infrastructure
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

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "us-central1"
}

variable "firebase_location" {
  description = "Firebase/Firestore location"
  type        = string
  default     = "us-central"
}

variable "bigquery_dataset_location" {
  description = "BigQuery dataset location"
  type        = string
  default     = "US"
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "postgres_tier" {
  description = "Cloud SQL machine type"
  type        = string
  default     = "db-g1-small"
}

variable "vertex_ai_region" {
  description = "Vertex AI region"
  type        = string
  default     = "us-central1"
}

variable "gemini_model" {
  description = "Gemini model version"
  type        = string
  default     = "gemini-2.0-flash-001"
}

variable "agents" {
  description = "Agent configurations"
  type = map(object({
    name         = string
    display_name = string
    tools_count  = number
  }))
  default = {
    performance_coach = {
      name         = "performance-coach"
      display_name = "Performance Coach Agent"
      tools_count  = 3
    }
    stats_analyst = {
      name         = "stats-analyst"
      display_name = "Stats Analyst Agent"
      tools_count  = 4
    }
    game_logger = {
      name         = "game-logger"
      display_name = "Game Logger Agent"
      tools_count  = 5
    }
    scout_report = {
      name         = "scout-report"
      display_name = "Scout Report Agent"
      tools_count  = 3
    }
    verification = {
      name         = "verification"
      display_name = "Verification Agent"
      tools_count  = 2
    }
  }
}
