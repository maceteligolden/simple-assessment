import { describe, it, expect } from 'vitest'
import { TestUtils, API_BASE_PATH } from '../../shared/test-utils'
import { TEST_USER, TEST_EXAMINER, INVALID_USER } from '../../fixtures/user.fixture'

describe('Auth Module Integration', () => {
  const agent = TestUtils.getAgent()

  describe('POST /signup', () => {
    it('should register a new participant successfully', async () => {
      const response = await agent
        .post(`${API_BASE_PATH}/auth/signup`)
        .send(TEST_USER)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(TEST_USER.email)
      expect(response.body.data.user.role).toBe('participant')
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('refreshToken')
    })

    it('should register a new examiner successfully', async () => {
      const response = await agent
        .post(`${API_BASE_PATH}/auth/signup`)
        .send(TEST_EXAMINER)

      expect(response.status).toBe(201)
      expect(response.body.data.user.role).toBe('examiner')
    })

    it('should fail if email already exists', async () => {
      // First signup
      await agent.post(`${API_BASE_PATH}/auth/signup`).send(TEST_USER)

      // Second signup with same email
      const response = await agent
        .post(`${API_BASE_PATH}/auth/signup`)
        .send(TEST_USER)

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /signin', () => {
    it('should sign in successfully with correct credentials', async () => {
      // Ensure user exists
      await agent.post(`${API_BASE_PATH}/auth/signup`).send(TEST_USER)

      const response = await agent
        .post(`${API_BASE_PATH}/auth/signin`)
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('refreshToken')
      expect(response.body.data.user.email).toBe(TEST_USER.email)
    })

    it('should fail with invalid credentials', async () => {
      const response = await agent
        .post(`${API_BASE_PATH}/auth/signin`)
        .send(INVALID_USER)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /refresh', () => {
    it('should get new access token using refresh token', async () => {
      // 1. Sign up and Sign in to get refresh token
      await agent.post(`${API_BASE_PATH}/auth/signup`).send(TEST_USER)
      const loginRes = await agent
        .post(`${API_BASE_PATH}/auth/signin`)
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })

      const { refreshToken } = loginRes.body.data

      // 2. Refresh token
      const response = await agent
        .post(`${API_BASE_PATH}/auth/refresh`)
        .send({ refreshToken })

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('refreshToken')
    })
  })

  describe('Protected Routes (Global Login Demonstration)', () => {
    it('should access profile when authenticated as participant', async () => {
      // Use the global login utility
      const authAgent = await TestUtils.getAuthenticatedAgent('participant')

      const response = await authAgent.get(`${API_BASE_PATH}/auth/profile`)

      expect(response.status).toBe(200)
      expect(response.body.data.email).toBe(TEST_USER.email)
      expect(response.body.data.role).toBe('participant')
    })

    it('should access profile when authenticated as examiner', async () => {
      const authAgent = await TestUtils.getAuthenticatedAgent('examiner')

      const response = await authAgent.get(`${API_BASE_PATH}/auth/profile`)

      expect(response.status).toBe(200)
      expect(response.body.data.email).toBe(TEST_EXAMINER.email)
      expect(response.body.data.role).toBe('examiner')
    })

    it('should fail to access profile when unauthenticated', async () => {
      const response = await agent.get(`${API_BASE_PATH}/auth/profile`)

      expect(response.status).toBe(401)
    })
  })
})

