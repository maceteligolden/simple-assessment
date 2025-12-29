import http from 'k6/http'
import { check, sleep } from 'k6'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

/**
 * Full Load Test Scenario
 * Tests multiple endpoints simultaneously to simulate real-world usage
 */
export const options: Options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 30 },
    { duration: '5m', target: 30 },
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
  },
}

interface SetupData {
  accessToken: string
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
  }
}

export default function (data: SetupData): void {
  // Simulate different user actions with weighted probability
  const action = Math.random()

  if (action < 0.3) {
    // 30% - List exams (most common)
    listExams(data.accessToken)
  } else if (action < 0.5) {
    // 20% - Get profile
    getProfile(data.accessToken)
  } else if (action < 0.7) {
    // 20% - Get exam details
    getExamDetails(data.accessToken)
  } else if (action < 0.85) {
    // 15% - List participants
    listParticipants(data.accessToken)
  } else if (action < 0.95) {
    // 10% - Create exam
    createExam(data.accessToken)
  } else {
    // 5% - Other operations
    getMyExams(data.accessToken)
  }

  sleep(1)
}

function listExams(token: string): void {
  const response = http.get(`${API_BASE}/exams`, {
    ...getAuthHeaders(token),
    tags: { name: 'ListExams' },
  })

  check(response, {
    'list exams success': (r) => r.status === 200,
  })
}

function getProfile(token: string): void {
  const response = http.get(`${API_BASE}/auth/profile`, {
    ...getAuthHeaders(token),
    tags: { name: 'GetProfile' },
  })

  check(response, {
    'get profile success': (r) => r.status === 200,
  })
}

function getExamDetails(token: string): void {
  // This would need a real exam ID - simplified for demo
  const response = http.get(`${API_BASE}/exams/test-id`, {
    ...getAuthHeaders(token),
    tags: { name: 'GetExamDetails' },
  })

  // Allow 404s as exam might not exist
  check(response, {
    'get exam details': (r) => r.status === 200 || r.status === 404,
  })
}

function listParticipants(token: string): void {
  // This would need a real exam ID
  const response = http.get(`${API_BASE}/exams/test-id/participants`, {
    ...getAuthHeaders(token),
    tags: { name: 'ListParticipants' },
  })

  check(response, {
    'list participants': (r) => r.status === 200 || r.status === 404,
  })
}

function createExam(token: string): void {
  const timestamp = Date.now()
  const payload = JSON.stringify({
    title: `Load Test Exam ${timestamp}`,
    description: 'Load test exam',
    duration: 60,
    availableAnytime: true,
  })

  const response = http.post(`${API_BASE}/exams`, payload, {
    ...getAuthHeaders(token),
    tags: { name: 'CreateExam' },
  })

  check(response, {
    'create exam success': (r) => r.status === 201,
  })
}

function getMyExams(token: string): void {
  const response = http.get(`${API_BASE}/exams/participants/me`, {
    ...getAuthHeaders(token),
    tags: { name: 'GetMyExams' },
  })

  check(response, {
    'get my exams success': (r) => r.status === 200,
  })
}

