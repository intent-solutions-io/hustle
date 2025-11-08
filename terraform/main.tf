# ==============================================================================
# Hustle - Multi-Project Terraform Root Configuration
# ==============================================================================
# This orchestrates the entire infrastructure across multiple GCP projects
# ==============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    bucket = "hustleapp-terraform-state"
    prefix = "prod/infrastructure"
  }
}

# ==============================================================================
# Provider Configuration
# ==============================================================================

provider "google" {
  region = var.region
}

provider "google-beta" {
  region = var.region
}

# ==============================================================================
# GCP Projects
# ==============================================================================

module "projects" {
  source = "./modules/projects"

  organization_id = var.organization_id
  billing_account = var.billing_account
  project_prefix  = var.project_prefix
  environment     = var.environment
}

# ==============================================================================
# Networking (VPC, Peering, Firewall)
# ==============================================================================

module "vpc" {
  source = "./modules/vpc"

  project_id = module.projects.data_project_id
  region     = var.region

  depends_on = [module.projects]
}

# ==============================================================================
# Frontend Infrastructure (Firebase, Firestore, Storage)
# ==============================================================================

module "firebase" {
  source = "./modules/firebase"

  project_id       = module.projects.frontend_project_id
  firebase_location = var.firebase_location

  depends_on = [module.projects]
}

module "firestore" {
  source = "./modules/firestore"

  project_id = module.projects.frontend_project_id
  location   = var.firebase_location

  depends_on = [module.firebase]
}

module "cloud_storage_frontend" {
  source = "./modules/cloud-storage"

  project_id = module.projects.frontend_project_id
  region     = var.region

  buckets = {
    player_media = {
      name          = "${var.project_prefix}-player-media-${var.environment}"
      storage_class = "STANDARD"
      lifecycle_rules = [
        {
          action = { type = "Delete" }
          condition = { age = 365 } # Delete after 1 year
        }
      ]
    }
    embeddings = {
      name          = "${var.project_prefix}-embeddings-${var.environment}"
      storage_class = "STANDARD"
      lifecycle_rules = []
    }
    reports = {
      name          = "${var.project_prefix}-reports-${var.environment}"
      storage_class = "NEARLINE"
      lifecycle_rules = [
        {
          action = { type = "Delete" }
          condition = { age = 90 } # Delete after 90 days
        }
      ]
    }
  }

  depends_on = [module.projects]
}

# ==============================================================================
# Data Layer (BigQuery, Cloud SQL)
# ==============================================================================

module "bigquery" {
  source = "./modules/bigquery"

  project_id = module.projects.data_project_id
  location   = var.bigquery_dataset_location

  datasets = {
    analytics = {
      dataset_id  = "hustle_analytics"
      description = "Player and game analytics"
      tables = {
        player_stats = {
          schema = file("${path.module}/schemas/bigquery/player_stats.json")
        }
        game_aggregates = {
          schema = file("${path.module}/schemas/bigquery/game_aggregates.json")
        }
      }
    }
    ml_features = {
      dataset_id  = "hustle_ml_features"
      description = "ML feature engineering"
      tables = {}
    }
    agent_logs = {
      dataset_id  = "hustle_agent_logs"
      description = "Agent interaction logs"
      tables = {
        agent_conversations = {
          schema = file("${path.module}/schemas/bigquery/agent_conversations.json")
        }
      }
    }
  }

  depends_on = [module.projects]
}

module "cloud_sql" {
  source = "./modules/cloud-sql"

  project_id       = module.projects.data_project_id
  region           = var.region
  postgres_version = var.postgres_version
  postgres_tier    = var.postgres_tier

  database_name = "hustle_db"
  vpc_id        = module.vpc.vpc_id

  depends_on = [module.vpc]
}

# ==============================================================================
# Agent Projects (Vertex AI + Cloud Run)
# ==============================================================================

# Performance Coach Agent
module "agent_performance_coach" {
  source = "./modules/vertex-ai-agent"

  project_id    = module.projects.agent_coach_project_id
  agent_name    = "performance-coach"
  display_name  = "Performance Coach Agent"
  region        = var.vertex_ai_region
  gemini_model  = var.gemini_model

  system_instruction = file("${path.module}/prompts/performance-coach/system.txt")

  tools = [
    {
      name        = "analyze_player_trends"
      description = "Analyze performance trends for a specific player"
      webhook_url = module.cloud_run_coach_tools.service_urls["analyze-trends"]
      parameters = {
        player_id   = { type = "string", required = true }
        metric      = { type = "string", required = true }
        time_period = { type = "string", required = false }
      }
    },
    {
      name        = "suggest_training_drills"
      description = "Suggest training drills based on weaknesses"
      webhook_url = module.cloud_run_coach_tools.service_urls["suggest-drills"]
      parameters = {
        skill_area       = { type = "string", required = true }
        age_group        = { type = "string", required = true }
        difficulty_level = { type = "string", required = false }
      }
    },
    {
      name        = "compare_to_average"
      description = "Compare player stats to averages"
      webhook_url = module.cloud_run_coach_tools.service_urls["compare-stats"]
      parameters = {
        player_id       = { type = "string", required = true }
        comparison_type = { type = "string", required = true }
      }
    }
  ]

  datastore_id = module.vertex_search_knowledge.datastore_id

  depends_on = [module.projects, module.vertex_search_knowledge]
}

module "cloud_run_coach_tools" {
  source = "./modules/cloud-run"

  project_id = module.projects.agent_coach_project_id
  region     = var.region

  services = {
    analyze-trends = {
      image       = "gcr.io/${module.projects.agent_coach_project_id}/analyze-trends:latest"
      memory      = "512Mi"
      cpu         = "1"
      timeout     = 60
      env_vars    = {
        DATA_PROJECT_ID = module.projects.data_project_id
      }
    }
    suggest-drills = {
      image       = "gcr.io/${module.projects.agent_coach_project_id}/suggest-drills:latest"
      memory      = "512Mi"
      cpu         = "1"
      timeout     = 60
      env_vars    = {
        DATA_PROJECT_ID = module.projects.data_project_id
      }
    }
    compare-stats = {
      image       = "gcr.io/${module.projects.agent_coach_project_id}/compare-stats:latest"
      memory      = "512Mi"
      cpu         = "1"
      timeout     = 60
      env_vars    = {
        DATA_PROJECT_ID = module.projects.data_project_id
      }
    }
  }

  depends_on = [module.projects]
}

# Vertex AI Search (Shared Knowledge Base)
module "vertex_search_knowledge" {
  source = "./modules/vertex-ai-search"

  project_id    = module.projects.data_project_id
  datastore_id  = "hustle-knowledge-base"
  display_name  = "Hustle Knowledge Base"
  location      = "global"

  content_config = "CONTENT_REQUIRED"
  solution_types = ["SOLUTION_TYPE_SEARCH"]

  documents_bucket = module.cloud_storage_frontend.bucket_names["embeddings"]

  depends_on = [module.projects, module.cloud_storage_frontend]
}

# ==============================================================================
# IAM & Service Accounts
# ==============================================================================

module "iam" {
  source = "./modules/iam"

  frontend_project_id = module.projects.frontend_project_id
  data_project_id     = module.projects.data_project_id

  agent_projects = {
    coach  = module.projects.agent_coach_project_id
    analyst = module.projects.agent_analyst_project_id
    logger  = module.projects.agent_logger_project_id
    scout   = module.projects.agent_scout_project_id
    verify  = module.projects.agent_verify_project_id
  }

  depends_on = [module.projects]
}

# ==============================================================================
# Outputs
# ==============================================================================

output "project_ids" {
  description = "All GCP project IDs"
  value = {
    frontend = module.projects.frontend_project_id
    data     = module.projects.data_project_id
    agents = {
      coach   = module.projects.agent_coach_project_id
      analyst = module.projects.agent_analyst_project_id
      logger  = module.projects.agent_logger_project_id
      scout   = module.projects.agent_scout_project_id
      verify  = module.projects.agent_verify_project_id
    }
  }
}

output "firebase_hosting_url" {
  description = "Firebase Hosting URL"
  value       = module.firebase.hosting_url
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name"
  value       = module.cloud_sql.connection_name
}

output "agent_endpoints" {
  description = "Vertex AI Agent endpoints"
  value = {
    performance_coach = module.agent_performance_coach.agent_endpoint
  }
}
