# ==============================================================================
# BigQuery Module Outputs
# ==============================================================================

output "dataset_ids" {
  description = "Map of dataset IDs"
  value = {
    for key, dataset in google_bigquery_dataset.datasets : key => dataset.dataset_id
  }
}

output "dataset_self_links" {
  description = "Map of dataset self links"
  value = {
    for key, dataset in google_bigquery_dataset.datasets : key => dataset.self_link
  }
}

output "table_ids" {
  description = "Map of table IDs"
  value = {
    for key, table in google_bigquery_table.tables : key => table.table_id
  }
}
