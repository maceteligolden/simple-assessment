import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const searchUsersErrorRate = new Rate('search_users_errors')

/**
 * Search Users Load Test
 * Tests GET /api/v1/auth/search endpoint under various load conditions
 * 
 * Endpoint: GET /api/v1/auth/search?email=...
 * Expected: 200 OK
 * Bottleneck: Database query, email search
 * Access: Examiner only
 */
export const options: Options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    http_req_failed: ['rate<0.02'],
    search_users_errors: ['rate<0.02'],
  },
}

interface SetupData {
  accessToken: string
  searchEmail: string
}

export function setup(): SetupData {
  // Authenticate as examiner
  const signinPayload = JSON.stringify({
    email: __ENV.TEST_EXAMINER_EMAIL || 'examiner@example.com',
    password: __ENV.TEST_EXAMINER_PASSWORD || 'TestPassword123!',
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
    searchEmail: __ENV.TEST_SEARCH_EMAIL || 'participant@example.com',
  }
}

export default function (data: SetupData): void {
  const params = {
    ...getAuthHeaders(data.accessToken),
    tags: { name: 'SearchUsers' },
  }

  const response = http.get(
    `${API_BASE}/auth/search?email=${data.searchEmail}`,
    params
  )

  const success = check(response, {
    'search users status is 200': (r) => r.status === 200,
    'search users has result': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && typeof body.data.exists === 'boolean'
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
  })

  searchUsersErrorRate.add(!success)

  sleep(0.5)
}

