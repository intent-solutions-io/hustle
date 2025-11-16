# ==============================================================================
# Firebase Module Outputs
# ==============================================================================

output "hosting_site_id" {
  description = "Firebase Hosting site ID"
  value       = google_firebase_hosting_site.default.site_id
}

output "hosting_url" {
  description = "Firebase Hosting URL"
  value       = "https://${google_firebase_hosting_site.default.site_id}.web.app"
}

output "firebase_project_id" {
  description = "Firebase project ID"
  value       = google_firebase_project.default.project
}
