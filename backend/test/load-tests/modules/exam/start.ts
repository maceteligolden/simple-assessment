import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const startExamErrorRate = new Rate('start_exam_errors')

export const options: Options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1200', 'p(99)<2000'],
    http_req_failed: ['rate<0.03'],
    start_exam_errors: ['rate<0.03'],
  },
}

interface SetupData {
  accessToken: string
  examAccessCode: string
}

export function setup(): SetupData {
  // Authenticate as participant
  const signinPayload = JSON.stringify({
    email: __ENV.TEST_PARTICIPANT_EMAIL || 'participant@example.com',
    password: __ENV.TEST_PARTICIPANT_PASSWORD || 'TestPassword123!',
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
  
  // Get exam access code (would need to create exam or use known code)
  const examAccessCode = __ENV.TEST_EXAM_ACCESS_CODE || 'TEST123'
  
  return {
    accessToken: body.data.accessToken,
    examAccessCode: examAccessCode,
  }
}

export default function (data: SetupData): void {
  const payload = JSON.stringify({
    accessCode: data.examAccessCode,
  })

  const params = {
    ...getAuthHeaders(data.accessToken),
    tags: { name: 'StartExam' },
  }

  const response = http.post(`${API_BASE}/exams/start`, payload, params)

  const success = check(response, {
    'start exam status is 201 or 409': (r) => r.status === 201 || r.status === 409, // 409 = already started
    'start exam has attempt ID': (r) => {
      if (r.status === 201) {
        const body = JSON.parse(r.body as string)
        return body.data && body.data.id
      }
      return true // 409 is acceptable
    },
    'response time < 1500ms': (r) => r.timings.duration < 1500,
  })

  startExamErrorRate.add(!success)

  sleep(2) // Wait 2 seconds between requests
}

