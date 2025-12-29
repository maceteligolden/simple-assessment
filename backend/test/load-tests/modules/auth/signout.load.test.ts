import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const signoutErrorRate = new Rate('signout_errors')

/**
 * Signout Load Test
 * Tests POST /api/v1/auth/signout endpoint under various load conditions
 * 
 * Endpoint: POST /api/v1/auth/signout
 * Expected: 200 OK
 * Bottleneck: Session revocation, database update
 */
export const options: Options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.02'],
    signout_errors: ['rate<0.02'],
  },
}

interface SetupData {
  accessToken: string
}

export function setup(): SetupData {
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
    accessToken: body.data.accessToken,
  }
}

export default function (data: SetupData): void {
  const params = {
    ...getAuthHeaders(data.accessToken),
    tags: { name: 'SignOut' },
  }

  const response = http.post(`${API_BASE}/auth/signout`, null, params)

  const success = check(response, {
    'signout status is 200': (r) => r.status === 200,
    'response time < 600ms': (r) => r.timings.duration < 600,
  })

  signoutErrorRate.add(!success)

  // After signout, need to sign in again for next iteration
  // This is handled by setup() which runs before each VU
  sleep(1)
}

