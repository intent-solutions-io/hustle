# ==============================================================================
# Vertex AI Agent Module - Agent Builder Apps
# ==============================================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }
}

# ==============================================================================
# Enable Required APIs
# ==============================================================================

resource "google_project_service" "aiplatform_api" {
  project            = var.project_id
  service            = "aiplatform.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "discoveryengine_api" {
  project            = var.project_id
  service            = "discoveryengine.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# Vertex AI Agent App (via Discovery Engine)
# ==============================================================================

# Note: Vertex AI Agent Builder is managed through Discovery Engine API
# The agent app configuration includes:
# - System instruction (prompt)
# - Model configuration (Gemini)
# - Tool/function definitions (OpenAPI specs)
# - RAG datastore integration

resource "google_discovery_engine_chat_engine" "agent" {
  provider = google-beta
  project  = var.project_id

  engine_id    = var.agent_name
  display_name = var.display_name
  location     = var.region
  collection_id = "default_collection"

  # Agent configuration
  chat_engine_config {
    agent_creation_config {
      business = var.display_name
      default_language_code = "en"

      # Time zone for the agent
      time_zone = "America/Chicago"

      # Agent configuration
      agent {
        display_name = var.display_name
        description  = "AI agent for ${var.display_name}"

        # System instruction (agent prompt)
        # In practice, this would be loaded from var.system_instruction
        # For now, we'll use a placeholder
      }
    }
  }

  # Associate with datastore for RAG
  data_store_ids = var.datastore_id != null ? [var.datastore_id] : []

  # Common data spec (optional)
  common_config {
    company_name = "Hustle"
  }

  depends_on = [
    google_project_service.aiplatform_api,
    google_project_service.discoveryengine_api
  ]
}

# ==============================================================================
# Note: Tool Integration
# ==============================================================================

# Tool integration is done via OpenAPI specs and requires:
# 1. Cloud Run service for each tool (created separately)
# 2. OpenAPI spec defining the tool's interface
# 3. Agent Builder console configuration (manual step)
#
# The tools array in variables defines the tool metadata,
# but actual integration requires API calls or console work.
#
# Example tool structure:
# {
#   name        = "analyze_player_trends"
#   description = "Analyze performance trends"
#   webhook_url = "https://tool-service.run.app/analyze"
#   parameters = {
#     player_id = { type = "string", required = true }
#   }
# }

# ==============================================================================
# Agent Endpoint Output
# ==============================================================================

# The agent endpoint will be available via Discovery Engine API
# Format: projects/{project}/locations/{location}/collections/default_collection/engines/{engine_id}
