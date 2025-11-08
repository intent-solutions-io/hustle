# ==============================================================================
# BigQuery Module - Data Warehouse Setup
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
# Enable BigQuery API
# ==============================================================================

resource "google_project_service" "bigquery_api" {
  project            = var.project_id
  service            = "bigquery.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "bigquery_storage_api" {
  project            = var.project_id
  service            = "bigquerystorage.googleapis.com"
  disable_on_destroy = false
}

# ==============================================================================
# BigQuery Datasets
# ==============================================================================

resource "google_bigquery_dataset" "datasets" {
  for_each = var.datasets

  project    = var.project_id
  dataset_id = each.value.dataset_id
  location   = var.location

  # Description
  description = each.value.description

  # Default table expiration (optional)
  default_table_expiration_ms = lookup(each.value, "default_table_expiration_days", null) != null ? lookup(each.value, "default_table_expiration_days", null) * 24 * 60 * 60 * 1000 : null

  # Labels
  labels = {
    environment = var.environment
    project     = "hustle"
    managed_by  = "terraform"
  }

  # Access control (default: project owners and editors)
  access {
    role          = "OWNER"
    special_group = "projectOwners"
  }

  access {
    role          = "WRITER"
    special_group = "projectWriters"
  }

  access {
    role          = "READER"
    special_group = "projectReaders"
  }

  depends_on = [
    google_project_service.bigquery_api,
    google_project_service.bigquery_storage_api
  ]
}

# ==============================================================================
# BigQuery Tables
# ==============================================================================

resource "google_bigquery_table" "tables" {
  for_each = {
    for pair in flatten([
      for dataset_key, dataset in var.datasets : [
        for table_key, table in lookup(dataset, "tables", {}) : {
          key         = "${dataset_key}_${table_key}"
          dataset_id  = dataset.dataset_id
          table_id    = table_key
          schema      = table.schema
          description = lookup(table, "description", "")
        }
      ]
    ]) : pair.key => pair
  }

  project    = var.project_id
  dataset_id = google_bigquery_dataset.datasets[split("_", each.key)[0]].dataset_id
  table_id   = each.value.table_id

  # Description
  description = each.value.description

  # Schema (JSON string)
  schema = each.value.schema

  # Time partitioning (optional, uncomment if needed)
  # time_partitioning {
  #   type = "DAY"
  #   field = "created_at"
  # }

  # Clustering (optional, uncomment if needed)
  # clustering = ["user_id", "game_id"]

  depends_on = [google_bigquery_dataset.datasets]
}
