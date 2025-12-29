/**
 * k6 Load Testing Configuration (TypeScript)
 * 
 * k6 supports TypeScript natively (v0.52.0+)
 * Install: brew install k6 (macOS) or see https://k6.io/docs/getting-started/installation/
 * 
 * Run tests:
 *   k6 run test/load-tests/modules/auth/signup.load.test.ts
 *   k6 run test/load-tests/modules/auth/signin.load.test.ts
 *   k6 run test/load-tests/modules/exams/create.load.test.ts
 *   k6 run test/load-tests/scenarios/full-load.ts
 */

import { Options } from 'k6/options'

export const options: Options = {
  // Default thresholds for all tests
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Less than 1% errors
    http_reqs: ['rate>10'], // At least 10 requests per second
  },
  
  // Summary output
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
}

/**
 * Common test scenarios
 */
export const scenarios = {
  // Smoke test - verify system works under minimal load
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '1m',
  },
  
  // Load test - normal expected load
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 10 }, // Ramp up to 10 users
      { duration: '5m', target: 10 }, // Stay at 10 users
      { duration: '2m', target: 0 }, // Ramp down
    ],
  },
  
  // Stress test - beyond normal load to find breaking point
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 20 },
      { duration: '5m', target: 20 },
      { duration: '2m', target: 50 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 0 },
    ],
  },
  
  // Spike test - sudden increase in load
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 10 },
      { duration: '30s', target: 100 }, // Sudden spike
      { duration: '1m', target: 100 },
      { duration: '30s', target: 10 },
      { duration: '1m', target: 10 },
      { duration: '1m', target: 0 },
    ],
  },
  
  // Soak test - sustained load over time
  soak: {
    executor: 'constant-vus',
    vus: 20,
    duration: '30m',
  },
}

/**
 * Helper function to get base URL
 */
export function getBaseUrl(): string {
  return __ENV.BASE_URL || 'http://localhost:5008'
}

/**
 * Helper function to get API version
 */
export function getApiVersion(): string {
  return __ENV.API_VERSION || 'v1'
}

/**
 * Helper function to create auth headers
 */
export function getAuthHeaders(token?: string): { headers: Record<string, string> } {
  if (!token) {
    return {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  }
  
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }
}

