#!/bin/bash

###############################################################################
# Hustle Survey - Smoke Test Script
#
# Purpose: Validates basic functionality of the survey application
# Usage: ./smoke-test.sh [BASE_URL]
# Example: ./smoke-test.sh http://localhost:4000
#          ./smoke-test.sh https://hustlesurvey.intentsolutions.io
###############################################################################

set -e  # Exit on any error

# Configuration
BASE_URL="${1:-http://localhost:4000}"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# Helper Functions
###############################################################################

print_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_test() {
  echo -e "${YELLOW}TEST:${NC} $1"
}

print_success() {
  echo -e "${GREEN}✅ PASS:${NC} $1"
  ((TESTS_PASSED++))
}

print_failure() {
  echo -e "${RED}❌ FAIL:${NC} $1"
  ((TESTS_FAILED++))
}

print_info() {
  echo -e "${BLUE}INFO:${NC} $1"
}

# Run HTTP test
test_http() {
  local url=$1
  local expected_status=$2
  local test_name=$3

  ((TESTS_RUN++))
  print_test "$test_name"

  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>&1) || true

  if [ "$response" = "$expected_status" ]; then
    print_success "$url returned $response"
    return 0
  else
    print_failure "$url returned $response (expected $expected_status)"
    return 1
  fi
}

# Run HTTP test with body check
test_http_body() {
  local url=$1
  local search_string=$2
  local test_name=$3

  ((TESTS_RUN++))
  print_test "$test_name"

  response=$(curl -s --max-time $TIMEOUT "$url" 2>&1) || true

  if echo "$response" | grep -q "$search_string"; then
    print_success "Found '$search_string' in response"
    return 0
  else
    print_failure "Did not find '$search_string' in response"
    return 1
  fi
}

###############################################################################
# Start Tests
###############################################################################

print_header "Hustle Survey - Smoke Test Suite"
print_info "Target: $BASE_URL"
print_info "Timeout: ${TIMEOUT}s"
print_info "Started: $(date)"

###############################################################################
# Test Group 1: Basic Page Loads
###############################################################################

print_header "Test Group 1: Basic Page Loads"

# Test landing page
test_http "$BASE_URL" 200 "Landing page loads"

# Test all 15 survey sections
for i in {1..15}; do
  test_http "$BASE_URL/survey/$i" 200 "Section $i loads"
done

# Test completion page
test_http "$BASE_URL/survey/complete" 200 "Completion page loads"

###############################################################################
# Test Group 2: Content Validation
###############################################################################

print_header "Test Group 2: Content Validation"

# Test landing page content
test_http_body "$BASE_URL" "Help Us Build the Future of Youth Sports Tracking" \
  "Landing page contains expected heading"

test_http_body "$BASE_URL" "Start Survey" \
  "Landing page contains Start Survey button"

# Test Section 1 content
test_http_body "$BASE_URL/survey/1" "Quick Start" \
  "Section 1 contains expected title"

test_http_body "$BASE_URL/survey/1" "Do you consent" \
  "Section 1 contains consent question"

# Test Section 2 content (Sports Family)
test_http_body "$BASE_URL/survey/2" "Your Sports Family" \
  "Section 2 contains expected title"

# Test completion page content
test_http_body "$BASE_URL/survey/complete" "Thank You" \
  "Completion page contains thank you message"

###############################################################################
# Test Group 3: API Endpoints
###############################################################################

print_header "Test Group 3: API Endpoints"

# Test API health check
test_http "$BASE_URL/api/survey/submit" 200 "API endpoint responds"

# Test API with GET (should return health check)
test_http_body "$BASE_URL/api/survey/submit" "status" \
  "API health check returns status"

###############################################################################
# Test Group 4: Error Handling
###############################################################################

print_header "Test Group 4: Error Handling"

# Test invalid section number
test_http "$BASE_URL/survey/999" 200 "Invalid section returns page (with error message)"

test_http_body "$BASE_URL/survey/999" "Section Not Found" \
  "Invalid section shows error message"

# Test section 0 (invalid)
test_http "$BASE_URL/survey/0" 200 "Section 0 returns page (with error message)"

# Test negative section
test_http "$BASE_URL/survey/-1" 200 "Negative section returns page (with error message)"

###############################################################################
# Test Group 5: Performance & Assets
###############################################################################

print_header "Test Group 5: Performance & Assets"

# Test page load time
print_test "Page load performance"
((TESTS_RUN++))

start_time=$(date +%s%N)
curl -s -o /dev/null --max-time $TIMEOUT "$BASE_URL" || true
end_time=$(date +%s%N)

load_time=$(( (end_time - start_time) / 1000000 )) # Convert to ms

if [ $load_time -lt 3000 ]; then
  print_success "Landing page loaded in ${load_time}ms (< 3000ms)"
  ((TESTS_PASSED++))
else
  print_failure "Landing page loaded in ${load_time}ms (>= 3000ms)"
  ((TESTS_FAILED++))
fi

###############################################################################
# Test Results Summary
###############################################################################

print_header "Test Results Summary"

echo -e "Total Tests Run: ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed:    ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed:    ${RED}$TESTS_FAILED${NC}"

PASS_RATE=$(( TESTS_PASSED * 100 / TESTS_RUN ))
echo -e "Pass Rate:       ${BLUE}${PASS_RATE}%${NC}"

echo ""
print_info "Completed: $(date)"

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                   ║${NC}"
  echo -e "${GREEN}║  ✅  ALL SMOKE TESTS PASSED  ✅                  ║${NC}"
  echo -e "${GREEN}║                                                   ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                                                   ║${NC}"
  echo -e "${RED}║  ❌  SMOKE TESTS FAILED  ❌                       ║${NC}"
  echo -e "${RED}║                                                   ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi
