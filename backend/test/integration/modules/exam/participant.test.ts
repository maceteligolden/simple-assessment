import { describe, it, expect, beforeAll } from 'vitest'
import { TestUtils, API_BASE_PATH } from '../../shared/test-utils'
import { TEST_EXAMINER, TEST_USER } from '../../fixtures/user.fixture'

describe('Participant Module Integration', () => {
  let examinerAgent: any
  let examId: string
  let participantId: string

  beforeAll(async () => {
    examinerAgent = await TestUtils.getAuthenticatedAgent('examiner')
    
    // Create an exam
    const examResponse = await examinerAgent
      .post(`${API_BASE_PATH}/exams`)
      .send({
        title: 'Participant Test Exam',
        duration: 30,
        availableAnytime: true,
        passPercentage: 50,
      })
    
    examId = examResponse.body.data.id

    // Ensure the participant user exists
    const agent = TestUtils.getAgent()
    await agent.post(`${API_BASE_PATH}/auth/signup`).send(TEST_USER)
  })

  describe('POST /exams/:id/participants', () => {
    it('should add a participant to the exam', async () => {
      const response = await examinerAgent
        .post(`${API_BASE_PATH}/exams/${examId}/participants`)
        .send({ email: TEST_USER.email })

      expect(response.status).toBe(201)
      expect(response.body.data.email).toBe(TEST_USER.email)
      expect(response.body.data.accessCode).toBeDefined()
      participantId = response.body.data.id
    })

    it('should fail when adding a non-existent user as participant', async () => {
      const response = await examinerAgent
        .post(`${API_BASE_PATH}/exams/${examId}/participants`)
        .send({ email: 'nonexistent@test.com' })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /exams/:id/participants', () => {
    it('should list participants for the exam', async () => {
      const response = await examinerAgent
        .get(`${API_BASE_PATH}/exams/${examId}/participants`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })
  })

  describe('DELETE /api/v1/exams/participants/:participantId', () => {
    it('should remove a participant', async () => {
      const response = await examinerAgent
        .delete(`${API_BASE_PATH}/exams/participants/${participantId}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
