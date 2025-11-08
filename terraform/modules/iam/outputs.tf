# ==============================================================================
# IAM Module Outputs
# ==============================================================================

output "frontend_service_account_email" {
  description = "Frontend service account email"
  value       = google_service_account.frontend.email
}

output "data_access_service_account_email" {
  description = "Data access service account email"
  value       = google_service_account.data_access.email
}

output "agent_service_account_emails" {
  description = "Map of agent service account emails"
  value = {
    for key, sa in google_service_account.agents : key => sa.email
  }
}
