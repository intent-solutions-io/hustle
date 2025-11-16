# ==============================================================================
# Cloud Storage Module Outputs
# ==============================================================================

output "bucket_names" {
  description = "Map of bucket names"
  value = {
    for key, bucket in google_storage_bucket.buckets : key => bucket.name
  }
}

output "bucket_urls" {
  description = "Map of bucket URLs"
  value = {
    for key, bucket in google_storage_bucket.buckets : key => bucket.url
  }
}

output "bucket_self_links" {
  description = "Map of bucket self links"
  value = {
    for key, bucket in google_storage_bucket.buckets : key => bucket.self_link
  }
}
