# ==============================================================================
# Cloud Run Module Outputs
# ==============================================================================

output "service_urls" {
  description = "Map of Cloud Run service URLs"
  value = {
    for key, service in google_cloud_run_service.services : key => service.status[0].url
  }
}

output "service_names" {
  description = "Map of Cloud Run service names"
  value = {
    for key, service in google_cloud_run_service.services : key => service.name
  }
}

output "service_locations" {
  description = "Map of Cloud Run service locations"
  value = {
    for key, service in google_cloud_run_service.services : key => service.location
  }
}
