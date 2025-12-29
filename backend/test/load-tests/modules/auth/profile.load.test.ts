import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const profileErrorRate = new Rate('profile_errors')

/**
 * Profile Load Test
 * Tests GET /api/v1/auth/profile endpoint under various load conditions
 * 
 * Endpoint: GET /api/v1/auth/profile
 * Expected: 200 OK
 * Bottleneck: Database lookup (minimal)
 */
export const options: Options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '1m', target: 300 },
    { duration: '3m', target: 300 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<400'], // Profile should be very fast
    http_req_failed: ['rate<0.01'],
    profile_errors: ['rate<0.01'],
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
    tags: { name: 'GetProfile' },
  }

  const response = http.get(`${API_BASE}/auth/profile`, params)

  const success = check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.email && body.data.id
    },
    'profile has required fields': (r) => {
      const body = JSON.parse(r.body as string)
      return (
        body.data &&
        body.data.firstName &&
        body.data.lastName &&
        body.data.role
      )
    },
    'response time < 300ms': (r) => r.timings.duration < 300,
  })

  profileErrorRate.add(!success)

  sleep(0.2) // Profile can be called very frequently
}

