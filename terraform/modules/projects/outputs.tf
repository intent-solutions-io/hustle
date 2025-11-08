# ==============================================================================
# Projects Module Outputs
# ==============================================================================

output "frontend_project_id" {
  description = "Frontend project ID"
  value       = google_project.frontend.project_id
}

output "frontend_project_number" {
  description = "Frontend project number"
  value       = google_project.frontend.number
}

output "data_project_id" {
  description = "Data project ID"
  value       = google_project.data.project_id
}

output "data_project_number" {
  description = "Data project number"
  value       = google_project.data.number
}

output "agent_coach_project_id" {
  description = "Performance Coach agent project ID"
  value       = google_project.agent_coach.project_id
}

output "agent_coach_project_number" {
  description = "Performance Coach agent project number"
  value       = google_project.agent_coach.number
}

output "agent_analyst_project_id" {
  description = "Stats Analyst agent project ID"
  value       = google_project.agent_analyst.project_id
}

output "agent_analyst_project_number" {
  description = "Stats Analyst agent project number"
  value       = google_project.agent_analyst.number
}

output "agent_logger_project_id" {
  description = "Game Logger agent project ID"
  value       = google_project.agent_logger.project_id
}

output "agent_logger_project_number" {
  description = "Game Logger agent project number"
  value       = google_project.agent_logger.number
}

output "agent_scout_project_id" {
  description = "Scout Report agent project ID"
  value       = google_project.agent_scout.project_id
}

output "agent_scout_project_number" {
  description = "Scout Report agent project number"
  value       = google_project.agent_scout.number
}

output "agent_verify_project_id" {
  description = "Verification agent project ID"
  value       = google_project.agent_verify.project_id
}

output "agent_verify_project_number" {
  description = "Verification agent project number"
  value       = google_project.agent_verify.number
}

output "all_project_ids" {
  description = "Map of all project IDs"
  value = {
    frontend = google_project.frontend.project_id
    data     = google_project.data.project_id
    coach    = google_project.agent_coach.project_id
    analyst  = google_project.agent_analyst.project_id
    logger   = google_project.agent_logger.project_id
    scout    = google_project.agent_scout.project_id
    verify   = google_project.agent_verify.project_id
  }
}
