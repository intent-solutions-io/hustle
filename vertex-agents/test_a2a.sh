#!/bin/bash
# Test A2A Agent System
# Usage: ./test_a2a.sh [registration|player|game|all]

set -euo pipefail

PROJECT_ID="hustleapp-production"
REGION="us-central1"
TEST_TYPE="${1:-registration}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Get Cloud Function URL
get_function_url() {
    gcloud functions describe orchestrator \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(httpsTrigger.url)" 2>/dev/null
}

# Test user registration
test_registration() {
    log_info "Testing user registration flow..."

    local FUNCTION_URL=$(get_function_url)

    if [ -z "$FUNCTION_URL" ]; then
        log_error "Cloud Function not deployed. Deploy with: firebase deploy --only functions:orchestrator"
        return 1
    fi

    local EMAIL="test-$(date +%s)@example.com"

    log_info "Sending registration request for: $EMAIL"

    local RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"data\": {
                \"intent\": \"user_registration\",
                \"data\": {
                    \"firstName\": \"Test\",
                    \"lastName\": \"User\",
                    \"email\": \"$EMAIL\",
                    \"password\": \"TestPass123!\"
                }
            }
        }")

    echo "$RESPONSE" | jq '.'

    # Verify response
    local SUCCESS=$(echo "$RESPONSE" | jq -r '.result.success')

    if [ "$SUCCESS" = "true" ]; then
        log_info "✓ Registration test PASSED"
        local USER_ID=$(echo "$RESPONSE" | jq -r '.result.data.userId')
        log_info "User ID: $USER_ID"

        # Check agent execution times
        log_info "Agent execution times:"
        echo "$RESPONSE" | jq '.result.agent_execution'

        return 0
    else
        log_error "✗ Registration test FAILED"
        echo "$RESPONSE" | jq '.result.errors'
        return 1
    fi
}

# Test player creation
test_player_creation() {
    log_info "Testing player creation flow..."

    log_warn "Player creation requires authentication - skipping for now"
    log_info "Run authenticated test from frontend app"

    return 0
}

# Test game logging
test_game_logging() {
    log_info "Testing game logging flow..."

    log_warn "Game logging requires authentication - skipping for now"
    log_info "Run authenticated test from frontend app"

    return 0
}

# Test agent endpoints
test_agent_endpoints() {
    log_info "Testing agent endpoints..."

    local AGENTS=("hustle-operations-manager" "hustle-validation-agent" "hustle-user-creation-agent" "hustle-onboarding-agent" "hustle-analytics-agent")

    for agent in "${AGENTS[@]}"; do
        log_info "Checking agent: $agent"

        if gcloud ai agents describe "$agent" \
            --region="$REGION" \
            --project="$PROJECT_ID" &> /dev/null; then
            log_info "✓ Agent $agent exists"
        else
            log_warn "✗ Agent $agent not found"
        fi
    done
}

# Test all
test_all() {
    log_info "========================================="
    log_info "Running All A2A Tests"
    log_info "========================================="

    test_agent_endpoints
    echo ""
    test_registration
    echo ""
    test_player_creation
    echo ""
    test_game_logging

    log_info "========================================="
    log_info "All tests complete"
    log_info "========================================="
}

# Main
main() {
    log_info "A2A Agent System Test"
    log_info "Project: $PROJECT_ID"
    log_info "Region: $REGION"
    log_info "Test Type: $TEST_TYPE"
    echo ""

    case "$TEST_TYPE" in
        registration)
            test_registration
            ;;
        player)
            test_player_creation
            ;;
        game)
            test_game_logging
            ;;
        endpoints)
            test_agent_endpoints
            ;;
        all)
            test_all
            ;;
        *)
            log_error "Unknown test type: $TEST_TYPE"
            echo "Usage: $0 [registration|player|game|endpoints|all]"
            exit 1
            ;;
    esac
}

main "$@"
