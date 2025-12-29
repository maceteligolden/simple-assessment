import { describe, it, expect, beforeAll } from 'vitest'
import { TestUtils, API_BASE_PATH } from '../../shared/test-utils'
import { TEST_EXAMINER, TEST_USER } from '../../fixtures/user.fixture'

describe('Exam Attempt Integration', () => {
  let examinerAgent: any
  let participantAgent: any
  let examId: string
  let accessCode: string
  let attemptId: string
  let questionId: string

  beforeAll(async () => {
    examinerAgent = await TestUtils.getAuthenticatedAgent('examiner')
    participantAgent = await TestUtils.getAuthenticatedAgent('participant')

    // 1. Examiner creates an exam
    const examRes = await examinerAgent
      .post(`${API_BASE_PATH}/exams`)
      .send({
        title: 'Full Attempt Flow Exam',
        duration: 30,
        availableAnytime: true,
        passPercentage: 50,
      })
    examId = examRes.body.data.id

    // 2. Examiner adds a question
    const qRes = await examinerAgent
      .post(`${API_BASE_PATH}/exams/${examId}/questions`)
      .send({
        type: 'multi-choice',
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '1',
        points: 1,
      })
    questionId = qRes.body.data.id

    // 3. Examiner adds participant
    const pRes = await examinerAgent
      .post(`${API_BASE_PATH}/exams/${examId}/participants`)
      .send({ email: TEST_USER.email })
    accessCode = pRes.body.data.accessCode
  })

  describe('Full Exam Flow', () => {
    it('should start the exam with access code', async () => {
      const response = await participantAgent
        .post(`${API_BASE_PATH}/exams/start`)
        .send({ accessCode })

      expect(response.status).toBe(200)
      expect(response.body.data.attemptId).toBeDefined()
      attemptId = response.body.data.attemptId
    })

    it('should get the first question', async () => {
      const response = await participantAgent
        .get(`${API_BASE_PATH}/exams/attempts/${attemptId}/questions/next`)

      expect(response.status).toBe(200)
      expect(response.body.data.question.id).toBe(questionId)
    })

    it('should submit an answer', async () => {
      const response = await participantAgent
        .put(`${API_BASE_PATH}/exams/attempts/${attemptId}/answers/${questionId}`)
        .send({
          answer: '1',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should submit the exam', async () => {
      const response = await participantAgent
        .post(`${API_BASE_PATH}/exams/attempts/${attemptId}/submit`)

      expect(response.status).toBe(200)
      expect(response.body.data.percentage).toBe(100)
    })

    it('should get attempt results', async () => {
      const response = await participantAgent
        .get(`${API_BASE_PATH}/exams/attempts/${attemptId}/results`)

      expect(response.status).toBe(200)
      expect(response.body.data.score).toBe(1)
      expect(response.body.data.passed).toBe(true)
    })
  })
})
