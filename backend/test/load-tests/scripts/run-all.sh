#!/bin/bash

# Run all load tests and generate a summary report
# Usage: ./load-tests/scripts/run-all.sh

set -e

BASE_URL="${BASE_URL:-http://localhost:5008}"
API_VERSION="${API_VERSION:-v1}"
OUTPUT_DIR="load-tests/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting comprehensive load test suite..."
echo "Base URL: $BASE_URL"
echo "API Version: $API_VERSION"
echo "Results will be saved to: $OUTPUT_DIR"
echo ""

# Create results directory
mkdir -p "$OUTPUT_DIR"

# Run smoke test first
echo "📊 Running smoke test..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/smoke_$TIMESTAMP.json" \
  --summary-only \
  test/load-tests/modules/auth/signin.load.test.ts || echo "⚠️  Smoke test failed (this is expected if server is not running)"

echo ""
echo "📊 Running authentication load tests..."

# Auth tests
echo "  - Signup test..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/signup_$TIMESTAMP.json" \
  test/load-tests/modules/auth/signup.load.test.ts > "$OUTPUT_DIR/signup_$TIMESTAMP.log" 2>&1 || true

echo "  - Signin test..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/signin_$TIMESTAMP.json" \
  test/load-tests/modules/auth/signin.load.test.ts > "$OUTPUT_DIR/signin_$TIMESTAMP.log" 2>&1 || true

echo "  - Refresh token test..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/refresh_token_$TIMESTAMP.json" \
  test/load-tests/modules/auth/refresh-token.load.test.ts > "$OUTPUT_DIR/refresh_token_$TIMESTAMP.log" 2>&1 || true

echo "  - Profile test..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/profile_$TIMESTAMP.json" \
  test/load-tests/modules/auth/profile.load.test.ts > "$OUTPUT_DIR/profile_$TIMESTAMP.log" 2>&1 || true

echo ""
echo "📊 Running exam load tests..."

# Exam tests
echo "  - Create exam test..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/create_exam_$TIMESTAMP.json" \
  test/load-tests/modules/exams/create.ts > "$OUTPUT_DIR/create_exam_$TIMESTAMP.log" 2>&1 || true

echo "  - List exams test..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/list_exams_$TIMESTAMP.json" \
  test/load-tests/modules/exams/list.ts > "$OUTPUT_DIR/list_exams_$TIMESTAMP.log" 2>&1 || true

echo ""
echo "📊 Running full load scenario..."
k6 run --env BASE_URL="$BASE_URL" --env API_VERSION="$API_VERSION" \
  --out json="$OUTPUT_DIR/full_load_$TIMESTAMP.json" \
  test/load-tests/scenarios/full-load.ts > "$OUTPUT_DIR/full_load_$TIMESTAMP.log" 2>&1 || true

echo ""
echo "✅ Load test suite completed!"
echo "📁 Results saved to: $OUTPUT_DIR"
echo ""
echo "To view results, check the JSON files or logs in: $OUTPUT_DIR"

