import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const refreshTokenErrorRate = new Rate('refresh_token_errors')

/**
 * Refresh Token Load Test
 * Tests POST /api/v1/auth/refresh endpoint under various load conditions
 * 
 * Endpoint: POST /api/v1/auth/refresh
 * Expected: 200 OK
 * Bottleneck: JWT verification, database session lookup
 */
export const options: Options = {
  stages: [
    { duration: '1m', target: 30 },
    { duration: '3m', target: 30 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 150 },
    { duration: '3m', target: 150 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'], // Refresh should be fast
    http_req_failed: ['rate<0.01'],
    refresh_token_errors: ['rate<0.01'],
  },
}

interface SetupData {
  refreshToken: string
}

export function setup(): SetupData {
  // First sign in to get a refresh token
  const signinPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'test@example.com',
    password: __ENV.TEST_PASSWORD || 'TestPassword123!',
  })

  const signinResponse = http.post(
    `${API_BASE}/auth/signin`,
    signinPayload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  if (signinResponse.status !== 200) {
    throw new Error('Failed to authenticate for load test')
  }

  const body = JSON.parse(signinResponse.body as string)
  return {
    refreshToken: body.data.refreshToken,
  }
}

export default function (data: SetupData): void {
  const payload = JSON.stringify({
    refreshToken: data.refreshToken,
  })

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'RefreshToken' },
  }

  const response = http.post(`${API_BASE}/auth/refresh`, payload, params)

  const success = check(response, {
    'refresh token status is 200': (r) => r.status === 200,
    'refresh token has new access token': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.accessToken
    },
    'refresh token has new refresh token': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.refreshToken
    },
    'response time < 400ms': (r) => r.timings.duration < 400,
  })

  refreshTokenErrorRate.add(!success)

  sleep(0.3) // Refresh tokens can be called more frequently
}

