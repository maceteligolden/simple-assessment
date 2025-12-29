import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const signinErrorRate = new Rate('signin_errors')

/**
 * Signin Load Test
 * Tests POST /api/v1/auth/signin endpoint under various load conditions
 * 
 * Endpoint: POST /api/v1/auth/signin
 * Expected: 200 OK
 * Bottleneck: Password comparison, database lookup
 */
export const options: Options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 150 },
    { duration: '3m', target: 150 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    signin_errors: ['rate<0.01'],
  },
}

interface SetupData {
  testEmail: string
  testPassword: string
}

// Pre-create test users (run once before test)
export function setup(): SetupData {
  // This would ideally create test users, but for simplicity,
  // we'll use a known test account
  // In real scenario, create users via API or seed script
  return {
    testEmail: __ENV.TEST_EMAIL || 'test@example.com',
    testPassword: __ENV.TEST_PASSWORD || 'TestPassword123!',
  }
}

export default function (data: SetupData): void {
  const payload = JSON.stringify({
    email: data.testEmail,
    password: data.testPassword,
  })

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'SignIn' },
  }

  const response = http.post(`${API_BASE}/auth/signin`, payload, params)

  const success = check(response, {
    'signin status is 200': (r) => r.status === 200,
    'signin has access token': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.accessToken
    },
    'signin has refresh token': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.refreshToken
    },
    'signin has user data': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.user && body.data.user.email
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
  })

  signinErrorRate.add(!success)

  sleep(0.5) // Wait 0.5 seconds between requests
}

