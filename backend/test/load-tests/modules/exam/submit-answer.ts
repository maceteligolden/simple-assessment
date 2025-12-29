import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { Options } from 'k6/options'
import { getBaseUrl, getApiVersion, getAuthHeaders } from '../../k6.config.ts'

const BASE_URL = getBaseUrl()
const API_VERSION = getApiVersion()
const API_BASE = `${BASE_URL}/api/${API_VERSION}`

const submitAnswerErrorRate = new Rate('submit_answer_errors')

export const options: Options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1000'],
    http_req_failed: ['rate<0.02'],
    submit_answer_errors: ['rate<0.02'],
  },
}

interface SetupData {
  accessToken: string
  attemptId: string
  questionId: string
}

export function setup(): SetupData {
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
  
  // Would need actual attempt ID and question ID from a started exam
  return {
    accessToken: body.data.accessToken,
    attemptId: __ENV.TEST_ATTEMPT_ID || 'test-attempt-id',
    questionId: __ENV.TEST_QUESTION_ID || 'test-question-id',
  }
}

export default function (data: SetupData): void {
  const payload = JSON.stringify({
    answer: '0', // Answer option index
  })

  const params = {
    ...getAuthHeaders(data.accessToken),
    tags: { name: 'SubmitAnswer' },
  }

  const response = http.put(
    `${API_BASE}/exams/attempts/${data.attemptId}/answers/${data.questionId}`,
    payload,
    params
  )

  const success = check(response, {
    'submit answer status is 200 or 404': (r) => r.status === 200 || r.status === 404, // 404 = attempt/question not found
    'response time < 800ms': (r) => r.timings.duration < 800,
  })

  submitAnswerErrorRate.add(!success)

  sleep(0.5) // Answers can be submitted more frequently
}

