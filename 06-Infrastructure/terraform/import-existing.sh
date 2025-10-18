#!/bin/bash
# Import existing GCP resources into Terraform state
# Run this from the terraform directory

set -e

PROJECT_ID="hustle-devops"
REGION="us-central1"

echo "Importing existing infrastructure into Terraform state..."

# Import Load Balancer components
echo "Importing Load Balancer IP..."
terraform import google_compute_global_address.hustlestats_ip hustlestats-ip || true

echo "Importing Network Endpoint Group..."
terraform import google_compute_region_network_endpoint_group.hustlestats_neg projects/${PROJECT_ID}/regions/${REGION}/networkEndpointGroups/hustlestats-neg || true

echo "Importing Backend Service..."
terraform import google_compute_backend_service.hustlestats_backend hustlestats-backend || true

echo "Importing SSL Certificate..."
terraform import google_compute_managed_ssl_certificate.hustlestats_cert hustlestats-cert || true

echo "Importing URL Map..."
terraform import google_compute_url_map.hustlestats_urlmap hustlestats-urlmap || true

echo "Importing HTTPS Proxy..."
terraform import google_compute_target_https_proxy.hustlestats_https_proxy hustlestats-https-proxy || true

echo "Importing HTTP Proxy..."
terraform import google_compute_target_http_proxy.hustlestats_http_proxy hustlestats-http-proxy || true

echo "Importing HTTPS Forwarding Rule..."
terraform import google_compute_global_forwarding_rule.hustlestats_https_rule hustlestats-https-rule || true

echo "Importing HTTP Forwarding Rule..."
terraform import google_compute_global_forwarding_rule.hustlestats_http_rule hustlestats-http-rule || true

# Import Cloud SQL Database
echo "Importing Cloud SQL instance..."
terraform import google_sql_database_instance.postgres_db ${PROJECT_ID}:hustle-db-dev || true

# Import VPC Connector
echo "Importing VPC Connector..."
terraform import google_vpc_access_connector.connector projects/${PROJECT_ID}/locations/${REGION}/connectors/hustle-vpc-connector || true

# Import Cloud Run Service
echo "Importing Cloud Run service..."
terraform import google_cloud_run_service.hustle_app locations/${REGION}/namespaces/${PROJECT_ID}/services/hustle-app || true

echo ""
echo "Import complete! Run 'terraform plan' to see any drift from current state."
