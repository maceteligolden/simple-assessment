import { describe, it, expect, beforeAll } from 'vitest'
import { TestUtils, API_BASE_PATH } from '../../shared/test-utils'
import { TEST_EXAMINER, TEST_USER } from '../../fixtures/user.fixture'

describe('Exam Module Integration', () => {
  let examinerAgent: any
  let participantAgent: any
  let createdExamId: string

  beforeAll(async () => {
    examinerAgent = await TestUtils.getAuthenticatedAgent('examiner')
    participantAgent = await TestUtils.getAuthenticatedAgent('participant')
  })

  describe('POST /exams', () => {
    it('should create a new exam as examiner', async () => {
      const examData = {
        title: 'Integration Test Exam',
        description: 'Testing the exam creation flow',
        duration: 45,
        availableAnytime: true,
        randomizeQuestions: true,
        showResultsImmediately: true,
        passPercentage: 70,
      }

      const response = await examinerAgent
        .post(`${API_BASE_PATH}/exams`)
        .send(examData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(examData.title)
      expect(response.body.data).toHaveProperty('id')
      
      createdExamId = response.body.data.id
    })

    it('should fail to create exam as participant', async () => {
      const response = await participantAgent
        .post(`${API_BASE_PATH}/exams`)
        .send({ title: 'Should Fail' })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /exams', () => {
    it('should list exams created by examiner', async () => {
      const response = await examinerAgent.get(`${API_BASE_PATH}/exams`)

      expect(response.status).toBe(200)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.meta.pagination).toBeDefined()
    })
  })

  describe('GET /exams/:id', () => {
    it('should get exam details as creator', async () => {
      const response = await examinerAgent.get(`${API_BASE_PATH}/exams/${createdExamId}`)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(createdExamId)
      expect(response.body.data.title).toBe('Integration Test Exam')
    })

    it('should fail to get exam details as non-creator', async () => {
      // Create another examiner
      const otherExaminerAgent = await TestUtils.getAuthenticatedAgent('examiner')
      // Note: getAuthenticatedAgent with 'examiner' uses the same TEST_EXAMINER fixture.
      // For isolation, we should probably have more fixtures or dynamic user creation.
      // But since we clear DB between tests in setup.integration.ts, and agents are created in beforeAll,
      // let's just use the participant agent which is definitely not the creator.
      
      const response = await participantAgent.get(`${API_BASE_PATH}/exams/${createdExamId}`)

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /exams/:id', () => {
    it('should update exam details as creator', async () => {
      const updateData = {
        title: 'Updated Integration Exam',
        passPercentage: 80,
      }

      const response = await examinerAgent
        .put(`${API_BASE_PATH}/exams/${createdExamId}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.title).toBe(updateData.title)
    })
  })

  describe('Exam Access Flow (Participant)', () => {
    let accessCode: string

    it('should add participant to exam', async () => {
      const response = await examinerAgent
        .post(`${API_BASE_PATH}/exams/${createdExamId}/participants`)
        .send({ email: TEST_USER.email })

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('accessCode')
      accessCode = response.body.data.accessCode
    })

    it('should get exam by access code as participant', async () => {
      const response = await participantAgent
        .get(`${API_BASE_PATH}/exams/by-code/${accessCode}`)

      expect(response.status).toBe(200)
      expect(response.body.data.title).toBe('Updated Integration Exam')
      expect(response.body.data.accessCode).toBe(accessCode)
    })

    it('should fail to get exam by code belonging to another user', async () => {
      // Create another participant user
      const otherUser = {
        ...TEST_USER,
        email: 'other@test.com'
      }
      
      const agent = TestUtils.getAgent()
      await agent.post(`${API_BASE_PATH}/auth/signup`).send(otherUser)
      const loginRes = await agent.post(`${API_BASE_PATH}/auth/signin`).send({
        email: otherUser.email,
        password: otherUser.password
      })
      const token = loginRes.body.data.accessToken
      
      const response = await agent
        .get(`${API_BASE_PATH}/exams/by-code/${accessCode}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /exams/:id', () => {
    it('should delete exam as creator', async () => {
      const response = await examinerAgent.delete(`${API_BASE_PATH}/exams/${createdExamId}`)

      expect(response.status).toBe(200)
      expect(response.body.meta.message).toContain('successfully')
    })

    it('should return 404 for deleted exam', async () => {
      const response = await examinerAgent.get(`${API_BASE_PATH}/exams/${createdExamId}`)
      expect(response.status).toBe(404)
    })
  })
})

