import { injectable, inject } from 'tsyringe'
import { ISessionRepository } from '../repository/session.repository'
import { logger } from '../util/logger'
import {
  generateSessionToken,
  calculateSessionExpiration,
  isSessionExpired,
} from '../util/session'
import { ENV } from '../constants'
import { NotFoundError, UnauthorizedError } from '../errors'
import { ISession } from '../model/session.model'

/**
 * Session Service Interface
 * Defines the contract for session business logic
 */
export interface ISessionService {
  createSession(data: {
    userId: string
    refreshToken: string
    ipAddress?: string
    userAgent?: string
  }): Promise<ISession>
  getSessionByToken(sessionToken: string): Promise<ISession>
  getSessionByRefreshToken(refreshToken: string): Promise<ISession>
  updateSessionActivity(sessionId: string): Promise<void>
  revokeSession(sessionId: string): Promise<void>
  revokeAllUserSessions(userId: string): Promise<number>
  getUserSessions(userId: string, activeOnly?: boolean): Promise<ISession[]>
  cleanupExpiredSessions(): Promise<number>
}

/**
 * Session Service Implementation
 * Handles all session business logic
 */
@injectable()
export class SessionService implements ISessionService {
  constructor(
    @inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository
  ) {
    logger.debug('SessionService initialized')
  }

  /**
   * Create a new session
   */
  async createSession(data: {
    userId: string
    refreshToken: string
    ipAddress?: string
    userAgent?: string
  }): Promise<ISession> {
    try {
      logger.info('Creating new session', { userId: data.userId })

      const sessionToken = generateSessionToken()
      const expiresAt = calculateSessionExpiration(ENV.SESSION_DURATION_MINUTES)

      const session = await this.sessionRepository.create({
        userId: data.userId,
        sessionToken,
        refreshToken: data.refreshToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt,
      })

      logger.info('Session created successfully', {
        sessionId: session._id.toString(),
        userId: data.userId,
      })

      return session
    } catch (error) {
      logger.error('Error creating session', error)
      throw error
    }
  }

  /**
   * Get session by session token
   */
  async getSessionByToken(sessionToken: string): Promise<ISession> {
    try {
      logger.debug('Getting session by token')

      const session = await this.sessionRepository.findByToken(sessionToken)

      if (!session) {
        logger.warn('Session not found by token')
        throw new NotFoundError('Session not found or expired')
      }

      // Check if session is expired
      if (isSessionExpired(session.expiresAt)) {
        logger.warn('Session expired', { sessionId: session._id.toString() })
        // Mark as inactive
        await this.sessionRepository.revoke(session._id.toString())
        throw new UnauthorizedError('Session has expired')
      }

      // Check if session is active
      if (!session.isActive) {
        logger.warn('Session is inactive', {
          sessionId: session._id.toString(),
        })
        throw new UnauthorizedError('Session has been revoked')
      }

      return session
    } catch (error) {
      logger.error('Error getting session by token', error)
      throw error
    }
  }

  /**
   * Get session by refresh token
   */
  async getSessionByRefreshToken(refreshToken: string): Promise<ISession> {
    try {
      logger.debug('Getting session by refresh token')

      const session =
        await this.sessionRepository.findByRefreshToken(refreshToken)

      if (!session) {
        logger.warn('Session not found by refresh token')
        throw new NotFoundError('Session not found or expired')
      }

      // Check if session is expired
      if (isSessionExpired(session.expiresAt)) {
        logger.warn('Session expired', { sessionId: session._id.toString() })
        // Mark as inactive
        await this.sessionRepository.revoke(session._id.toString())
        throw new UnauthorizedError('Session has expired')
      }

      // Check if session is active
      if (!session.isActive) {
        logger.warn('Session is inactive', {
          sessionId: session._id.toString(),
        })
        throw new UnauthorizedError('Session has been revoked')
      }

      return session
    } catch (error) {
      logger.error('Error getting session by refresh token', error)
      throw error
    }
  }

  /**
   * Update session last activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      logger.debug('Updating session activity', { sessionId })

      const session = await this.sessionRepository.updateActivity(sessionId)

      if (!session) {
        logger.warn('Session not found for activity update', { sessionId })
        throw new NotFoundError('Session not found')
      }
    } catch (error) {
      logger.error('Error updating session activity', error)
      throw error
    }
  }

  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      logger.info('Revoking session', { sessionId })

      const revoked = await this.sessionRepository.revoke(sessionId)

      if (!revoked) {
        logger.warn('Session not found for revocation', { sessionId })
        throw new NotFoundError('Session not found')
      }

      logger.info('Session revoked successfully', { sessionId })
    } catch (error) {
      logger.error('Error revoking session', error)
      throw error
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    try {
      logger.info('Revoking all user sessions', { userId })

      const count = await this.sessionRepository.revokeAllByUserId(userId)

      logger.info('All user sessions revoked', { userId, count })
      return count
    } catch (error) {
      logger.error('Error revoking all user sessions', error)
      throw error
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(
    userId: string,
    activeOnly = true
  ): Promise<ISession[]> {
    try {
      logger.debug('Getting user sessions', { userId, activeOnly })

      const sessions = await this.sessionRepository.findByUserId(
        userId,
        activeOnly
      )

      return sessions
    } catch (error) {
      logger.error('Error getting user sessions', error)
      throw error
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      logger.info('Cleaning up expired sessions')

      const count = await this.sessionRepository.revokeExpired()

      logger.info('Expired sessions cleaned up', { count })
      return count
    } catch (error) {
      logger.error('Error cleaning up expired sessions', error)
      throw error
    }
  }
}
