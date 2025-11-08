# ==============================================================================
# Vertex AI Agent Module Outputs
# ==============================================================================

output "agent_id" {
  description = "Vertex AI Agent engine ID"
  value       = google_discovery_engine_chat_engine.agent.engine_id
}

output "agent_name" {
  description = "Vertex AI Agent full resource name"
  value       = google_discovery_engine_chat_engine.agent.name
}

output "agent_endpoint" {
  description = "Agent API endpoint"
  value       = "projects/${var.project_id}/locations/${var.region}/collections/default_collection/engines/${google_discovery_engine_chat_engine.agent.engine_id}"
}

output "chat_engine_id" {
  description = "Discovery Engine chat engine ID"
  value       = google_discovery_engine_chat_engine.agent.id
}
