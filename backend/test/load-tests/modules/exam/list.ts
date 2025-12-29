import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const listExamsErrorRate = new Rate('list_exams_errors')

export const options: Options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'], // Read operations should be fast
    http_req_failed: ['rate<0.01'],
    list_exams_errors: ['rate<0.01'],
  },
}

interface SetupData {
  accessToken: string
}

export function setup(): SetupData {
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
  }
}

export default function (data: SetupData): void {
  const params = {
    ...getAuthHeaders(data.accessToken),
    tags: { name: 'ListExams' },
  }

  const response = http.get(`${API_BASE}/exams`, params)

  const success = check(response, {
    'list exams status is 200': (r) => r.status === 200,
    'list exams has data array': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && Array.isArray(body.data)
    },
    'response time < 300ms': (r) => r.timings.duration < 300,
  })

  listExamsErrorRate.add(!success)

  sleep(0.3) // Read operations can be more frequent
}

