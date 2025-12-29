import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion } from '../../k6.config.js'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

// Custom metrics
const signupErrorRate = new Rate('signup_errors')

/**
 * Signup Load Test
 * Tests POST /api/v1/auth/signup endpoint under various load conditions
 * 
 * Endpoint: POST /api/v1/auth/signup
 * Expected: 201 Created
 * Bottleneck: Password hashing (bcrypt with 12 rounds)
 */
export const options: Options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '3m', target: 10 }, // Stay at 10 users
    { duration: '1m', target: 20 }, // Ramp up to 20 users
    { duration: '3m', target: 20 }, // Stay at 20 users
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'], // Signup is slower due to password hashing
    http_req_failed: ['rate<0.05'], // Allow 5% errors (duplicate emails)
    signup_errors: ['rate<0.05'],
  },
}

export default function (): void {
  // Generate unique email for each request
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  const email = `test_${timestamp}_${random}@loadtest.com`
  
  const payload = JSON.stringify({
    firstName: 'Load',
    lastName: 'Test',
    email: email,
    password: 'TestPassword123!',
    role: 'participant',
  })

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'SignUp' },
  }

  const response = http.post(`${API_BASE}/auth/signup`, payload, params)

  const success = check(response, {
    'signup status is 201': (r) => r.status === 201,
    'signup has access token': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.accessToken
    },
    'signup has refresh token': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.refreshToken
    },
    'signup has user data': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.user && body.data.user.email
    },
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  })

  signupErrorRate.add(!success)

  sleep(1) // Wait 1 second between requests
}

