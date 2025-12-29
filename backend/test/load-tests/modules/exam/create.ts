import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const createExamErrorRate = new Rate('create_exam_errors')

export const options: Options = {
  stages: [
    { duration: '1m', target: 5 }, // Lower concurrency for write operations
    { duration: '3m', target: 5 },
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.02'],
    create_exam_errors: ['rate<0.02'],
  },
}

interface SetupData {
  accessToken: string
}

// Get auth token before test
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
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  
  const payload = JSON.stringify({
    title: `Load Test Exam ${timestamp}_${random}`,
    description: 'This is a load test exam created during stress testing',
    duration: 60,
    availableAnytime: true,
    randomizeQuestions: false,
    showResultsImmediately: true,
  })

  const params = {
    ...getAuthHeaders(data.accessToken),
    tags: { name: 'CreateExam' },
  }

  const response = http.post(`${API_BASE}/exams`, payload, params)

  const success = check(response, {
    'create exam status is 201': (r) => r.status === 201,
    'create exam has exam ID': (r) => {
      const body = JSON.parse(r.body as string)
      return body.data && body.data.id
    },
    'response time < 1500ms': (r) => r.timings.duration < 1500,
  })

  createExamErrorRate.add(!success)

  sleep(2) // Wait 2 seconds between requests (write operations are slower)
}

