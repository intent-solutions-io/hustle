# Hustle MVP - Domain Configuration
# Domain mapping for hustlestats.io

# Domain mapping for production (hustlestats.io)
# Note: Must verify domain ownership first via gcloud domains verify
resource "google_cloud_run_domain_mapping" "hustlestats_io" {
  name     = "hustlestats.io"
  location = var.region
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_service.hustle_app.name
  }

  depends_on = [google_cloud_run_service.hustle_app]
}

# Domain mapping for www subdomain
resource "google_cloud_run_domain_mapping" "www_hustlestats_io" {
  name     = "www.hustlestats.io"
  location = var.region
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_service.hustle_app.name
  }

  depends_on = [google_cloud_run_service.hustle_app]
}

# Outputs with DNS configuration instructions
output "domain_setup_instructions" {
  description = "DNS configuration instructions for hustlestats.io"
  value       = <<-EOT
    ==================== DOMAIN SETUP INSTRUCTIONS ====================

    1. VERIFY DOMAIN OWNERSHIP:
       gcloud domains verify hustlestats.io

    2. CREATE DOMAIN MAPPINGS:
       Already configured via Terraform

    3. GET DNS RECORDS:
       gcloud beta run domain-mappings describe hustlestats.io --region=${var.region}
       gcloud beta run domain-mappings describe www.hustlestats.io --region=${var.region}

    4. UPDATE DNS AT YOUR REGISTRAR:
       Add the A and AAAA records from step 3 to your DNS provider

    5. WAIT FOR CERTIFICATE PROVISIONING:
       Google automatically provisions SSL certificate (15-30 minutes)
       Check status: gcloud beta run domain-mappings describe hustlestats.io --region=${var.region}

    6. UPDATE ENVIRONMENT VARIABLE:
       Once cert is ready, update Cloud Run service:
       gcloud run services update hustle-app \
         --region ${var.region} \
         --update-env-vars NEXTAUTH_URL=https://hustlestats.io

    7. VERIFY DEPLOYMENT:
       curl https://hustlestats.io/api/healthcheck

    ==================================================================

    For enterprise routing (multiple services, advanced features):
    - Set up Global HTTPS Load Balancer
    - Create Serverless NEG for Cloud Run
    - Configure SSL certificate and domain mapping at LB level
  EOT
}

# Output domain mapping status
output "domain_mappings" {
  description = "Domain mapping resources"
  value = {
    hustlestats_io     = google_cloud_run_domain_mapping.hustlestats_io.name
    www_hustlestats_io = google_cloud_run_domain_mapping.www_hustlestats_io.name
  }
}
