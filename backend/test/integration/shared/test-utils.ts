import request from 'supertest'
import app from '../../../src/app'
import { TEST_USER, TEST_EXAMINER } from '../fixtures/user.fixture'
import { ENV } from '../../../src/shared/constants'

/**
 * Base path for API endpoints
 */
export const API_BASE_PATH = `/api/${ENV.API_VERSION}`

/**
 * Test utilities for integration tests
 */
export class TestUtils {
  /**
   * Get an authenticated request agent for a participant
   */
  static async getAuthenticatedAgent(role: 'participant' | 'examiner' = 'participant') {
    const agent = request.agent(app)
    const user = role === 'participant' ? TEST_USER : TEST_EXAMINER

    // 1. Sign up if not exists (ignore error if exists)
    await agent.post(`${API_BASE_PATH}/auth/signup`).send(user)

    // 2. Sign in to get tokens/session
    const response = await agent.post(`${API_BASE_PATH}/auth/signin`).send({
      email: user.email,
      password: user.password,
    })

    const { accessToken } = response.body.data
    
    // Set default Authorization header for all subsequent requests with this agent
    const authenticatedAgent = new Proxy(agent, {
      get(target: any, prop: string) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(prop)) {
          return (...args: any[]) => target[prop](...args).set('Authorization', `Bearer ${accessToken}`)
        }
        return target[prop]
      }
    })

    return authenticatedAgent
  }

  /**
   * Create a fresh unauthenticated agent
   */
  static getAgent() {
    return request(app)
  }
}

