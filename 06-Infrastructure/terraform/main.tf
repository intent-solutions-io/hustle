# Hustle MVP - Main Terraform Configuration
# Cost-Optimized Infrastructure for Development

terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  # Service account keys blocked by org policy: constraints/iam.disableServiceAccountKeyCreation
  # Using Application Default Credentials (ADC) instead
  # Run: gcloud auth application-default login
  # credentials = file("${path.module}/.creds/terraform-sa-key.json")

  project = var.project_id
  region  = var.region
  zone    = var.zone
}
