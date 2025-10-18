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

  # GCS Backend for Terraform State (Production)
  # Uncomment after creating bucket manually:
  # gsutil mb -p hustle-dev-202510 -l us-central1 gs://hustle-tf-state
  # gsutil versioning set on gs://hustle-tf-state
  #
  # backend "gcs" {
  #   bucket  = "hustle-tf-state"
  #   prefix  = "terraform/state"
  # }
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
