# ==============================================================================
# VPC Module - Networking Infrastructure
# ==============================================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

# ==============================================================================
# Enable Required APIs
# ==============================================================================

resource "google_project_service" "compute_api" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "servicenetworking_api" {
  project            = var.project_id
  service            = "servicenetworking.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# VPC Network
# ==============================================================================

resource "google_compute_network" "vpc" {
  project                 = var.project_id
  name                    = var.vpc_name
  auto_create_subnetworks = false
  description             = "VPC network for ${var.project_id}"

  depends_on = [google_project_service.compute_api]
}

# ==============================================================================
# Subnet
# ==============================================================================

resource "google_compute_subnetwork" "subnet" {
  project       = var.project_id
  name          = var.subnet_name
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.vpc.id
  description   = "Primary subnet for application resources"

  depends_on = [google_compute_network.vpc]
}

# ==============================================================================
# Private IP Allocation for Cloud SQL
# ==============================================================================

resource "google_compute_global_address" "private_ip_address" {
  project       = var.project_id
  name          = "${var.vpc_name}-db-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
  description   = "Private IP range for Cloud SQL"

  depends_on = [google_compute_network.vpc]
}

# ==============================================================================
# Private VPC Connection for Cloud SQL
# ==============================================================================

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]

  depends_on = [
    google_compute_global_address.private_ip_address,
    google_project_service.servicenetworking_api
  ]
}

# ==============================================================================
# VPC Connector for Serverless (Cloud Run)
# ==============================================================================

resource "google_vpc_access_connector" "connector" {
  project       = var.project_id
  name          = "${var.vpc_name}-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = var.connector_cidr

  # Use e2-micro for cost optimization
  machine_type = "e2-micro"
  min_instances = 2
  max_instances = 3

  depends_on = [
    google_compute_network.vpc,
    google_project_service.compute_api
  ]
}

# ==============================================================================
# Firewall Rules
# ==============================================================================

# Allow HTTP/HTTPS traffic
resource "google_compute_firewall" "allow_http_https" {
  project     = var.project_id
  name        = "${var.vpc_name}-allow-http-https"
  network     = google_compute_network.vpc.name
  description = "Allow HTTP and HTTPS traffic from internet"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
  priority      = 1000

  depends_on = [google_compute_network.vpc]
}

# Allow SSH via IAP
resource "google_compute_firewall" "allow_ssh" {
  project     = var.project_id
  name        = "${var.vpc_name}-allow-ssh"
  network     = google_compute_network.vpc.name
  description = "Allow SSH access via Identity-Aware Proxy"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  # Google's IAP IP range
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["web-server"]
  priority      = 1000

  depends_on = [google_compute_network.vpc]
}

# Allow PostgreSQL within subnet
resource "google_compute_firewall" "allow_postgres" {
  project     = var.project_id
  name        = "${var.vpc_name}-allow-postgres"
  network     = google_compute_network.vpc.name
  description = "Allow PostgreSQL traffic within subnet"

  allow {
    protocol = "tcp"
    ports    = ["5432"]
  }

  source_ranges = [var.subnet_cidr]
  priority      = 1000

  depends_on = [google_compute_network.vpc]
}

# Allow internal communication within VPC
resource "google_compute_firewall" "allow_internal" {
  project     = var.project_id
  name        = "${var.vpc_name}-allow-internal"
  network     = google_compute_network.vpc.name
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
  priority      = 65534

  depends_on = [google_compute_network.vpc]
}
