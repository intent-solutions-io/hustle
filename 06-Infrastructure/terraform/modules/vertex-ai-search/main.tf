# ==============================================================================
# Vertex AI Search Module - RAG Datastores
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

resource "google_project_service" "discoveryengine_api" {
  project            = var.project_id
  service            = "discoveryengine.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# Vertex AI Search Datastore
# ==============================================================================

resource "google_discovery_engine_data_store" "datastore" {
  provider = google-beta
  project  = var.project_id

  data_store_id   = var.datastore_id
  display_name    = var.display_name
  location        = var.location
  industry_vertical = "GENERIC"

  # Content configuration
  content_config = var.content_config

  # Solution types (SOLUTION_TYPE_SEARCH for RAG)
  solution_types = var.solution_types

  depends_on = [google_project_service.discoveryengine_api]
}

# ==============================================================================
# Search Engine (Optional - for serving search results)
# ==============================================================================

resource "google_discovery_engine_search_engine" "engine" {
  count    = var.create_search_engine ? 1 : 0
  provider = google-beta
  project  = var.project_id

  engine_id    = "${var.datastore_id}-engine"
  display_name = "${var.display_name} Search Engine"
  location     = var.location
  collection_id = "default_collection"

  # Associate with datastore
  data_store_ids = [google_discovery_engine_data_store.datastore.data_store_id]

  # Search engine configuration
  search_engine_config {
    search_tier = var.search_tier
    search_add_ons = ["SEARCH_ADD_ON_LLM"]
  }

  depends_on = [google_discovery_engine_data_store.datastore]
}
