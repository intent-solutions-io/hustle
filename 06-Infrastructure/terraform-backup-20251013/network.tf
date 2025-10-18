# Hustle MVP - Network Configuration
# VPC, Subnets, Firewall Rules for cost-optimized setup

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = var.vpc_name
  auto_create_subnetworks = false
  project                 = var.project_id

  description = "VPC network for Hustle MVP"
}

# Subnet for Web Server
resource "google_compute_subnetwork" "subnet" {
  name          = var.subnet_name
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.vpc.id
  project       = var.project_id

  description = "Public subnet for web server and application resources"
}

# Private IP allocation for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "hustle-db-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
  project       = var.project_id

  description = "Private IP range for Cloud SQL"
}

# Private VPC connection for Cloud SQL
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]

  depends_on = [google_compute_global_address.private_ip_address]
}

# Firewall Rule: Allow HTTP/HTTPS traffic to web server
resource "google_compute_firewall" "allow_http_https" {
  name    = "hustle-allow-http-https"
  network = google_compute_network.vpc.name
  project = var.project_id

  description = "Allow HTTP and HTTPS traffic from internet to web server"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]

  priority = 1000
}

# Firewall Rule: Allow SSH for administration (restricted to IAP)
resource "google_compute_firewall" "allow_ssh" {
  name    = "hustle-allow-ssh"
  network = google_compute_network.vpc.name
  project = var.project_id

  description = "Allow SSH access via Identity-Aware Proxy"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  # Google's IAP IP range
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["web-server"]

  priority = 1000
}

# Firewall Rule: Allow PostgreSQL from subnet (for Cloud SQL)
resource "google_compute_firewall" "allow_postgres" {
  name    = "hustle-allow-postgres"
  network = google_compute_network.vpc.name
  project = var.project_id

  description = "Allow PostgreSQL traffic within subnet"

  allow {
    protocol = "tcp"
    ports    = ["5432"]
  }

  source_ranges = [var.subnet_cidr]

  priority = 1000
}

# Firewall Rule: Allow internal communication within VPC
resource "google_compute_firewall" "allow_internal" {
  name    = "hustle-allow-internal"
  network = google_compute_network.vpc.name
  project = var.project_id

  description = "Allow all internal VPC traffic"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [var.subnet_cidr]

  priority = 65534
}
