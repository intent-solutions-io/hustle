# ==============================================================================
# Vertex AI Search Module Outputs
# ==============================================================================

output "datastore_id" {
  description = "Vertex AI Search datastore ID"
  value       = google_discovery_engine_data_store.datastore.data_store_id
}

output "datastore_name" {
  description = "Vertex AI Search datastore name"
  value       = google_discovery_engine_data_store.datastore.name
}

output "engine_id" {
  description = "Vertex AI Search engine ID (if created)"
  value       = var.create_search_engine ? google_discovery_engine_search_engine.engine[0].engine_id : null
}

output "engine_name" {
  description = "Vertex AI Search engine name (if created)"
  value       = var.create_search_engine ? google_discovery_engine_search_engine.engine[0].name : null
}
