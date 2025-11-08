# ==============================================================================
# Firestore Module Outputs
# ==============================================================================

output "database_name" {
  description = "Firestore database name"
  value       = google_firestore_database.default.name
}

output "database_location" {
  description = "Firestore database location"
  value       = google_firestore_database.default.location_id
}

output "database_type" {
  description = "Firestore database type"
  value       = google_firestore_database.default.type
}
