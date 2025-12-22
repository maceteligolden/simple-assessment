import { injectable } from 'tsyringe'
import { ISession, Session } from '../model/session.model'
import { Types } from 'mongoose'
import { logger } from '../util/logger'

/**
 * Session Repository Interface
 * Defines the contract for session data access
 */
export interface ISessionRepository {
  create(data: {
    userId: string
    sessionToken: string
    refreshToken: string
    ipAddress?: string
    userAgent?: string
    expiresAt: Date
  }): Promise<ISession>
  findByToken(sessionToken: string): Promise<ISession | null>
  findByRefreshToken(refreshToken: string): Promise<ISession | null>
  findByUserId(userId: string, activeOnly?: boolean): Promise<ISession[]>
  updateActivity(sessionId: string): Promise<ISession | null>
  revoke(sessionId: string): Promise<boolean>
  revokeAllByUserId(userId: string): Promise<number>
  revokeExpired(): Promise<number>
  deleteById(sessionId: string): Promise<boolean>
}

/**
 * Session Repository Implementation
 * Handles all database operations for sessions
 */
@injectable()
export class SessionRepository implements ISessionRepository {
  /**
   * Create a new session
   */
  async create(data: {
    userId: string
    sessionToken: string
    refreshToken: string
    ipAddress?: string
    userAgent?: string
    expiresAt: Date
  }): Promise<ISession> {
    try {
      logger.debug('Creating session in repository', {
        userId: data.userId,
        expiresAt: data.expiresAt,
      })

      const session = new Session({
        userId: new Types.ObjectId(data.userId),
        sessionToken: data.sessionToken,
        refreshToken: data.refreshToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
        lastActivity: new Date(),
        isActive: true,
      })

      await session.save()
      logger.debug('Session created successfully in repository', {
        sessionId: session._id.toString(),
      })
      return session
    } catch (error) {
      logger.error('Error creating session in repository', error)
      throw error
    }
  }

  /**
   * Find session by session token
   */
  async findByToken(sessionToken: string): Promise<ISession | null> {
    try {
      logger.debug('Finding session by token in repository')
      const session = await Session.findOne({
        sessionToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
      return session
    } catch (error) {
      logger.error('Error finding session by token in repository', error)
      throw error
    }
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<ISession | null> {
    try {
      logger.debug('Finding session by refresh token in repository')
      const session = await Session.findOne({
        refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
      return session
    } catch (error) {
      logger.error(
        'Error finding session by refresh token in repository',
        error
      )
      throw error
    }
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: string, activeOnly = true): Promise<ISession[]> {
    try {
      logger.debug('Finding sessions by user ID in repository', {
        userId,
        activeOnly,
      })

      const query: Record<string, unknown> = {
        userId: new Types.ObjectId(userId),
      }

      if (activeOnly) {
        query.isActive = true
        query.expiresAt = { $gt: new Date() }
      }

      const sessions = await Session.find(query).sort({ lastActivity: -1 })
      return sessions
    } catch (error) {
      logger.error('Error finding sessions by user ID in repository', error)
      throw error
    }
  }

  /**
   * Update session last activity timestamp
   */
  async updateActivity(sessionId: string): Promise<ISession | null> {
    try {
      logger.debug('Updating session activity in repository', { sessionId })
      const session = await Session.findByIdAndUpdate(
        sessionId,
        { lastActivity: new Date() },
        { new: true }
      )
      return session
    } catch (error) {
      logger.error('Error updating session activity in repository', error)
      throw error
    }
  }

  /**
   * Revoke a session (mark as inactive)
   */
  async revoke(sessionId: string): Promise<boolean> {
    try {
      logger.debug('Revoking session in repository', { sessionId })
      const result = await Session.findByIdAndUpdate(
        sessionId,
        { isActive: false },
        { new: true }
      )
      return !!result
    } catch (error) {
      logger.error('Error revoking session in repository', error)
      throw error
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllByUserId(userId: string): Promise<number> {
    try {
      logger.debug('Revoking all sessions for user in repository', { userId })
      const result = await Session.updateMany(
        {
          userId: new Types.ObjectId(userId),
          isActive: true,
        },
        { isActive: false }
      )
      logger.debug('Sessions revoked', {
        userId,
        count: result.modifiedCount,
      })
      return result.modifiedCount
    } catch (error) {
      logger.error('Error revoking all sessions for user in repository', error)
      throw error
    }
  }

  /**
   * Revoke all expired sessions
   */
  async revokeExpired(): Promise<number> {
    try {
      logger.debug('Revoking expired sessions in repository')
      const result = await Session.updateMany(
        {
          expiresAt: { $lt: new Date() },
          isActive: true,
        },
        { isActive: false }
      )
      logger.debug('Expired sessions revoked', { count: result.modifiedCount })
      return result.modifiedCount
    } catch (error) {
      logger.error('Error revoking expired sessions in repository', error)
      throw error
    }
  }

  /**
   * Delete a session permanently
   */
  async deleteById(sessionId: string): Promise<boolean> {
    try {
      logger.debug('Deleting session in repository', { sessionId })
      const result = await Session.findByIdAndDelete(sessionId)
      return !!result
    } catch (error) {
      logger.error('Error deleting session in repository', error)
      throw error
    }
  }
}
