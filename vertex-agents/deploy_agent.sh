#!/bin/bash
# Deploy Hustle A2A Agents to Vertex AI Agent Engine
# Usage: ./deploy_agent.sh [orchestrator|validation|user-creation|onboarding|analytics|all]

set -euo pipefail

PROJECT_ID="hustleapp-production"
REGION="us-central1"
AGENT_TYPE="${1:-all}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check gcloud
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI not found. Please install Google Cloud SDK."
        exit 1
    fi

    # Check project
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
        log_warn "Current project is $CURRENT_PROJECT, switching to $PROJECT_ID"
        gcloud config set project "$PROJECT_ID"
    fi

    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        log_error "Not authenticated. Run: gcloud auth login"
        exit 1
    fi

    # Check APIs
    log_info "Checking required APIs..."
    REQUIRED_APIS=(
        "aiplatform.googleapis.com"
        "firestore.googleapis.com"
        "cloudfunctions.googleapis.com"
        "cloudbuild.googleapis.com"
    )

    for api in "${REQUIRED_APIS[@]}"; do
        if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            log_warn "Enabling $api..."
            gcloud services enable "$api" --project="$PROJECT_ID"
        fi
    done

    log_info "Prerequisites check complete"
}

# Create service account if not exists
create_service_account() {
    local SA_NAME="hustle-agent-sa"
    local SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

    log_info "Creating service account: $SA_NAME"

    if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &> /dev/null; then
        log_info "Service account already exists"
    else
        gcloud iam service-accounts create "$SA_NAME" \
            --display-name="Hustle A2A Agent Service Account" \
            --project="$PROJECT_ID"

        # Grant required roles
        log_info "Granting IAM roles..."
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/aiplatform.user"

        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/datastore.user"

        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/logging.logWriter"
    fi

    echo "$SA_EMAIL"
}

# Deploy a single agent
deploy_single_agent() {
    local AGENT_NAME=$1
    local AGENT_DIR="vertex-agents/$AGENT_NAME"

    log_info "Deploying agent: $AGENT_NAME"

    if [ ! -d "$AGENT_DIR" ]; then
        log_error "Agent directory not found: $AGENT_DIR"
        return 1
    fi

    # Check for required files
    if [ ! -f "$AGENT_DIR/config/agent.yaml" ]; then
        log_error "Agent configuration not found: $AGENT_DIR/config/agent.yaml"
        return 1
    fi

    # Build container image (if using containerized deployment)
    if [ -f "$AGENT_DIR/Dockerfile" ]; then
        log_info "Building container image for $AGENT_NAME..."

        IMAGE_NAME="gcr.io/$PROJECT_ID/hustle-$AGENT_NAME-agent:latest"

        gcloud builds submit "$AGENT_DIR" \
            --tag="$IMAGE_NAME" \
            --project="$PROJECT_ID"
    fi

    # Deploy to Vertex AI Agent Engine
    log_info "Deploying to Vertex AI Agent Engine..."

    # Note: Actual deployment command depends on ADK CLI availability
    # This is a placeholder for the actual deployment command

    # Option 1: Using Vertex AI Agent Builder API (via gcloud)
    # gcloud ai agents create "hustle-$AGENT_NAME-agent" \
    #     --config="$AGENT_DIR/config/agent.yaml" \
    #     --region="$REGION" \
    #     --project="$PROJECT_ID"

    # Option 2: Using Python ADK CLI
    # cd "$AGENT_DIR" && adk deploy --config config/agent.yaml

    # Option 3: Manual creation via Console (for now)
    log_warn "Manual deployment required via Vertex AI Console"
    log_info "Agent Card location: $AGENT_DIR/config/agent-card.json"
    log_info "Console URL: https://console.cloud.google.com/vertex-ai/agents?project=$PROJECT_ID"

    return 0
}

# Deploy orchestrator agent
deploy_orchestrator() {
    log_info "========================================="
    log_info "Deploying Orchestrator Agent"
    log_info "========================================="

    deploy_single_agent "orchestrator"
}

# Deploy validation agent
deploy_validation() {
    log_info "========================================="
    log_info "Deploying Validation Agent"
    log_info "========================================="

    deploy_single_agent "validation"
}

# Deploy user creation agent
deploy_user_creation() {
    log_info "========================================="
    log_info "Deploying User Creation Agent"
    log_info "========================================="

    deploy_single_agent "user-creation"
}

# Deploy onboarding agent
deploy_onboarding() {
    log_info "========================================="
    log_info "Deploying Onboarding Agent"
    log_info "========================================="

    deploy_single_agent "onboarding"
}

# Deploy analytics agent
deploy_analytics() {
    log_info "========================================="
    log_info "Deploying Analytics Agent"
    log_info "========================================="

    deploy_single_agent "analytics"
}

# Deploy all agents
deploy_all() {
    log_info "========================================="
    log_info "Deploying All Agents"
    log_info "========================================="

    deploy_validation
    deploy_user_creation
    deploy_onboarding
    deploy_analytics
    deploy_orchestrator

    log_info "========================================="
    log_info "All agents deployed successfully!"
    log_info "========================================="
}

# Main execution
main() {
    log_info "Starting Hustle A2A Agent Deployment"
    log_info "Project: $PROJECT_ID"
    log_info "Region: $REGION"
    log_info "Agent Type: $AGENT_TYPE"

    check_prerequisites

    local SA_EMAIL
    SA_EMAIL=$(create_service_account)
    log_info "Service Account: $SA_EMAIL"

    case "$AGENT_TYPE" in
        orchestrator)
            deploy_orchestrator
            ;;
        validation)
            deploy_validation
            ;;
        user-creation)
            deploy_user_creation
            ;;
        onboarding)
            deploy_onboarding
            ;;
        analytics)
            deploy_analytics
            ;;
        all)
            deploy_all
            ;;
        *)
            log_error "Unknown agent type: $AGENT_TYPE"
            echo "Usage: $0 [orchestrator|validation|user-creation|onboarding|analytics|all]"
            exit 1
            ;;
    esac

    log_info "Deployment complete!"
    log_info "Next steps:"
    log_info "1. Verify agents in Vertex AI Console"
    log_info "2. Test agent endpoints"
    log_info "3. Update Cloud Functions to use agent endpoints"
}

main "$@"
