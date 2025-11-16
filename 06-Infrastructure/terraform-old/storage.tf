# Hustle MVP - Storage Configuration
# GCS bucket for media uploads (player photos, documents, etc.)

# Generate unique bucket name suffix
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# GCS Bucket for Media Uploads
resource "google_storage_bucket" "media" {
  name          = "${var.bucket_name}-${random_id.bucket_suffix.hex}"
  location      = var.bucket_location
  storage_class = var.bucket_storage_class
  project       = var.project_id

  # Force destroy allows deletion even if bucket has objects (dev only!)
  force_destroy = true

  # Public access prevention (enforced by org policy)
  public_access_prevention = "enforced"

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # Versioning for accidental deletion protection
  versioning {
    enabled = true
  }

  # Lifecycle rules for cost optimization
  lifecycle_rule {
    condition {
      age = 90 # days
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE" # Move to cheaper storage after 90 days
    }
  }

  lifecycle_rule {
    condition {
      age        = 365 # days
      with_state = "ARCHIVED"
    }
    action {
      type = "Delete" # Auto-delete archived objects after 1 year
    }
  }

  # CORS configuration for web uploads
  cors {
    origin          = ["*"] # Restrict this in production!
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["Content-Type", "Authorization"]
    max_age_seconds = 3600
  }

  # Labels for cost tracking
  labels = {
    environment = var.environment
    project     = var.project_name
    managed_by  = "terraform"
    purpose     = "media-uploads"
  }
}

# Note: Public access removed due to org policy constraints
# Use signed URLs from Cloud Run app for temporary public access to specific files
# Example in Node.js:
#   const { Storage } = require('@google-cloud/storage');
#   const storage = new Storage();
#   const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl({
#     version: 'v4',
#     action: 'read',
#     expires: Date.now() + 15 * 60 * 1000, // 15 minutes
#   });

# Output bucket info
output "media_bucket_url_info" {
  description = "Instructions for accessing bucket files"
  value       = <<-EOT
    Bucket: ${google_storage_bucket.media.name}

    Access Method: Signed URLs (public access prevention enforced)

    Generate signed URL from Cloud Run app:
      const storage = new Storage();
      const [url] = await storage.bucket('${google_storage_bucket.media.name}')
        .file(fileName)
        .getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 900000 });
  EOT
}
