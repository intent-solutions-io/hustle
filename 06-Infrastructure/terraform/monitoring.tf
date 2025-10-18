# Google Cloud Monitoring Resources
# Configures logging, error reporting, monitoring, and alerting

# Notification Channel for Alerts (Email)
resource "google_monitoring_notification_channel" "email_alerts" {
  display_name = "Hustle Email Alerts"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }

  enabled = true
}

# Notification Channel for Slack (Optional)
resource "google_monitoring_notification_channel" "slack_alerts" {
  count = var.slack_webhook_url != "" ? 1 : 0

  display_name = "Hustle Slack Alerts"
  type         = "slack"

  labels = {
    url = var.slack_webhook_url
  }

  sensitive_labels {
    auth_token = var.slack_webhook_url
  }

  enabled = true
}

# Alert Policy: High Error Rate
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "Error rate > 10 errors/minute"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"cloud_run_revision\"",
        "resource.labels.service_name = \"${var.cloud_run_service_name}\"",
        "severity >= ERROR"
      ])

      duration   = "60s"
      comparison = "COMPARISON_GT"

      threshold_value = 10

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = concat(
    [google_monitoring_notification_channel.email_alerts.id],
    var.slack_webhook_url != "" ? [google_monitoring_notification_channel.slack_alerts[0].id] : []
  )

  alert_strategy {
    auto_close = "1800s" // Auto-close after 30 minutes if resolved
  }

  documentation {
    content = <<-EOT
      ## High Error Rate Detected

      The application is experiencing an elevated error rate (>10 errors/minute).

      **Action Items:**
      1. Check Cloud Error Reporting for error details
      2. Review recent deployments
      3. Check Cloud Logging for context
      4. Review Sentry dashboard for error patterns

      **Dashboard:** https://console.cloud.google.com/monitoring
      **Logs:** https://console.cloud.google.com/logs
    EOT
  }
}

# Alert Policy: High Latency
resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "High API Latency"
  combiner     = "OR"

  conditions {
    display_name = "P95 latency > 2 seconds"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"cloud_run_revision\"",
        "resource.labels.service_name = \"${var.cloud_run_service_name}\"",
        "metric.type = \"run.googleapis.com/request_latencies\""
      ])

      duration   = "120s"
      comparison = "COMPARISON_GT"

      threshold_value = 2000 // 2 seconds in milliseconds

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_PERCENTILE_95"
        group_by_fields      = ["resource.labels.service_name"]
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email_alerts.id]

  alert_strategy {
    auto_close = "3600s"
  }

  documentation {
    content = <<-EOT
      ## High API Latency Detected

      The application is experiencing slow response times (P95 > 2s).

      **Action Items:**
      1. Check Cloud Trace for slow requests
      2. Review database query performance
      3. Check for N+1 query issues
      4. Monitor resource utilization (CPU/Memory)

      **Trace:** https://console.cloud.google.com/traces
    EOT
  }
}

# Alert Policy: Memory Usage
resource "google_monitoring_alert_policy" "high_memory_usage" {
  display_name = "High Memory Usage"
  combiner     = "OR"

  conditions {
    display_name = "Memory utilization > 90%"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"cloud_run_revision\"",
        "resource.labels.service_name = \"${var.cloud_run_service_name}\"",
        "metric.type = \"run.googleapis.com/container/memory/utilizations\""
      ])

      duration   = "300s"
      comparison = "COMPARISON_GT"

      threshold_value = 0.9 // 90%

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email_alerts.id]

  documentation {
    content = <<-EOT
      ## High Memory Usage Detected

      The application is using >90% of allocated memory.

      **Action Items:**
      1. Review application logs for memory leaks
      2. Consider increasing memory allocation
      3. Check for large data processing operations
      4. Review caching strategies
    EOT
  }
}

# Log-Based Metric: 4xx Errors
resource "google_logging_metric" "http_4xx_count" {
  name = "http_4xx_errors"
  filter = join(" AND ", [
    "resource.type = \"cloud_run_revision\"",
    "resource.labels.service_name = \"${var.cloud_run_service_name}\"",
    "httpRequest.status >= 400",
    "httpRequest.status < 500"
  ])

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"

    labels {
      key         = "status_code"
      value_type  = "INT64"
      description = "HTTP status code"
    }
  }

  label_extractors = {
    "status_code" = "EXTRACT(httpRequest.status)"
  }
}

# Log-Based Metric: Database Query Duration
resource "google_logging_metric" "db_query_duration" {
  name = "database_query_duration_ms"
  filter = join(" AND ", [
    "resource.type = \"cloud_run_revision\"",
    "resource.labels.service_name = \"${var.cloud_run_service_name}\"",
    "jsonPayload.context = \"database\"",
    "jsonPayload.duration != \"\""
  ])

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "DISTRIBUTION"

    labels {
      key         = "query_type"
      value_type  = "STRING"
      description = "Type of database operation"
    }
  }

  value_extractor = "EXTRACT(jsonPayload.duration)"

  label_extractors = {
    "query_type" = "EXTRACT(jsonPayload.operation)"
  }

  bucket_options {
    exponential_buckets {
      num_finite_buckets = 64
      growth_factor      = 2
      scale              = 1
    }
  }
}

# Log Sink for Long-term Storage (BigQuery)
resource "google_logging_project_sink" "bigquery_sink" {
  name        = "hustle-logs-bigquery"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.logs.dataset_id}"

  filter = join(" AND ", [
    "resource.type = \"cloud_run_revision\"",
    "resource.labels.service_name = \"${var.cloud_run_service_name}\""
  ])

  unique_writer_identity = true

  bigquery_options {
    use_partitioned_tables = true
  }
}

# BigQuery Dataset for Logs
resource "google_bigquery_dataset" "logs" {
  dataset_id  = "application_logs"
  location    = var.region
  description = "Application logs for long-term analysis"

  default_table_expiration_ms = 31536000000 // 365 days

  labels = {
    env         = var.environment
    application = "hustle"
  }
}

# Grant BigQuery write permission to log sink
resource "google_bigquery_dataset_iam_member" "log_sink_writer" {
  dataset_id = google_bigquery_dataset.logs.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_project_sink.bigquery_sink.writer_identity
}

# Uptime Check: Health Endpoint
resource "google_monitoring_uptime_check_config" "health_check" {
  display_name = "Hustle Health Check"
  timeout      = "10s"
  period       = "60s" // Check every minute

  http_check {
    path         = "/api/healthcheck"
    port         = "443"
    use_ssl      = true
    validate_ssl = true

    accepted_response_status_codes {
      status_class = "STATUS_CLASS_2XX"
    }
  }

  monitored_resource {
    type = "uptime_url"

    labels = {
      project_id = var.project_id
      host       = var.domain_name
    }
  }

  content_matchers {
    content = "\"status\":\"healthy\""
    matcher = "CONTAINS_STRING"
  }
}

# Alert Policy: Uptime Check Failure
resource "google_monitoring_alert_policy" "uptime_failure" {
  display_name = "Application Downtime"
  combiner     = "OR"

  conditions {
    display_name = "Health check failing"

    condition_threshold {
      filter = join(" AND ", [
        "metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\"",
        "metric.label.check_id = \"${google_monitoring_uptime_check_config.health_check.uptime_check_id}\""
      ])

      comparison      = "COMPARISON_LT"
      threshold_value = 1
      duration        = "180s" // Alert after 3 consecutive failures

      aggregations {
        alignment_period     = "60s"
        cross_series_reducer = "REDUCE_FRACTION_TRUE"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
      }
    }
  }

  notification_channels = concat(
    [google_monitoring_notification_channel.email_alerts.id],
    var.slack_webhook_url != "" ? [google_monitoring_notification_channel.slack_alerts[0].id] : []
  )

  alert_strategy {
    auto_close = "900s"
  }

  documentation {
    content = <<-EOT
      ## APPLICATION DOWNTIME ALERT

      The application health check is failing. The service may be down.

      **URGENT ACTION REQUIRED:**
      1. Check Cloud Run service status
      2. Review recent deployments
      3. Check Cloud Logging for errors
      4. Verify database connectivity

      **Status Page:** https://console.cloud.google.com/run
    EOT
  }
}

# Variables for monitoring configuration
variable "alert_email" {
  description = "Email address for monitoring alerts"
  type        = string
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "hustle-app"
}

variable "domain_name" {
  description = "Domain name for uptime checks"
  type        = string
}
