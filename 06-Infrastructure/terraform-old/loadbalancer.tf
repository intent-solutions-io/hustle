# Hustle Production - Load Balancer Configuration
# Global HTTPS Load Balancer with SSL certificates

# Reserve global static IP address
resource "google_compute_global_address" "hustlestats_ip" {
  name = "hustlestats-ip"
}

# Network Endpoint Group for Cloud Run
resource "google_compute_region_network_endpoint_group" "hustlestats_neg" {
  name                  = "hustlestats-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_service.hustle_app.name
  }
}

# Backend Service
resource "google_compute_backend_service" "hustlestats_backend" {
  name                  = "hustlestats-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.hustlestats_neg.id
  }
}

# Managed SSL Certificate
resource "google_compute_managed_ssl_certificate" "hustlestats_cert" {
  name = "hustlestats-cert"

  managed {
    domains = ["hustlestats.io", "www.hustlestats.io"]
  }
}

# URL Map with www → non-www redirect
resource "google_compute_url_map" "hustlestats_urlmap" {
  name            = "hustlestats-urlmap"
  default_service = google_compute_backend_service.hustlestats_backend.id

  host_rule {
    hosts        = ["hustlestats.io"]
    path_matcher = "main"
  }

  host_rule {
    hosts        = ["www.hustlestats.io"]
    path_matcher = "redirect-www"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_service.hustlestats_backend.id
  }

  path_matcher {
    name = "redirect-www"

    default_url_redirect {
      host_redirect          = "hustlestats.io"
      https_redirect         = true
      redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
      strip_query            = false
    }
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "hustlestats_https_proxy" {
  name             = "hustlestats-https-proxy"
  url_map          = google_compute_url_map.hustlestats_urlmap.id
  ssl_certificates = [google_compute_managed_ssl_certificate.hustlestats_cert.id]
}

# HTTPS Forwarding Rule
resource "google_compute_global_forwarding_rule" "hustlestats_https_rule" {
  name                  = "hustlestats-https-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.hustlestats_https_proxy.id
  ip_address            = google_compute_global_address.hustlestats_ip.id
}

# HTTP Proxy (for redirect to HTTPS)
resource "google_compute_target_http_proxy" "hustlestats_http_proxy" {
  name    = "hustlestats-http-proxy"
  url_map = google_compute_url_map.hustlestats_urlmap.id
}

# HTTP Forwarding Rule
resource "google_compute_global_forwarding_rule" "hustlestats_http_rule" {
  name                  = "hustlestats-http-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.hustlestats_http_proxy.id
  ip_address            = google_compute_global_address.hustlestats_ip.id
}

# Outputs
output "load_balancer_ip" {
  description = "Static IP address for Load Balancer"
  value       = google_compute_global_address.hustlestats_ip.address
}

output "ssl_certificate_status" {
  description = "SSL Certificate provisioning status"
  value       = google_compute_managed_ssl_certificate.hustlestats_cert.managed[0].status
}

output "dns_configuration" {
  description = "DNS records to configure in Porkbun"
  value       = <<-EOT
    Add these DNS records in Porkbun:

    A Record (root):
      Type: A
      Host: @
      Answer: ${google_compute_global_address.hustlestats_ip.address}
      TTL: 600

    A Record (www):
      Type: A
      Host: www
      Answer: ${google_compute_global_address.hustlestats_ip.address}
      TTL: 600
  EOT
}
