import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionRepository } from '../../../src/shared/repository/session.repository'
import { Session } from '../../../src/shared/model/session.model'
import { Types } from 'mongoose'

// Mock the Session model
vi.mock('../../../src/shared/model/session.model', async () => {
  const { vi } = await import('vitest')
  const { Types } = await import('mongoose')

  const mockQuery = {
    sort: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  }

  class MockSession {
    _id: any
    userId: any
    sessionToken: string
    refreshToken: string
    ipAddress: string
    userAgent: string
    expiresAt: Date
    lastActivity: Date
    isActive: boolean
    save: any

    constructor(data: any) {
      this._id = data?._id || new Types.ObjectId('507f1f77bcf86cd799439011')
      this.userId = data?.userId || new Types.ObjectId('507f1f77bcf86cd799439012')
      this.sessionToken = data?.sessionToken || 'session-token-123'
      this.refreshToken = data?.refreshToken || 'refresh-token-123'
      this.ipAddress = data?.ipAddress || '127.0.0.1'
      this.userAgent = data?.userAgent || 'Mozilla/5.0'
      this.expiresAt = data?.expiresAt || new Date(Date.now() + 3600000)
      this.lastActivity = data?.lastActivity || new Date()
      this.isActive = data?.isActive ?? true
      this.save = vi.fn().mockResolvedValue(true)
      Object.assign(this, data)
    }
  }

  MockSession.findOne = vi.fn().mockReturnValue(mockQuery)
  MockSession.find = vi.fn().mockReturnValue(mockQuery)
  MockSession.findByIdAndUpdate = vi.fn()
  MockSession.findByIdAndDelete = vi.fn()
  MockSession.updateMany = vi.fn()

  return {
    Session: MockSession,
  }
})

// Mock logger
vi.mock('../../../src/shared/util/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('SessionRepository', () => {
  let repository: SessionRepository
  let mockQuery: any
  let mockSessionInstance: any

  beforeEach(() => {
    repository = new SessionRepository()
    vi.clearAllMocks()
    
    mockQuery = {
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    }
    
    mockSessionInstance = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
      sessionToken: 'session-token-123',
      refreshToken: 'refresh-token-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      expiresAt: new Date(Date.now() + 3600000),
      lastActivity: new Date(),
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    }
    
    ;(Session.findOne as any).mockReturnValue(mockQuery)
    ;(Session.find as any).mockReturnValue(mockQuery)
    mockQuery.sort.mockReturnThis()
    mockQuery.exec.mockResolvedValue(null)
  })


  describe('findByToken', () => {
    it('should find session by token successfully', async () => {
      // Arrange
      const sessionToken = 'session-token-123'
      ;(Session.findOne as any).mockResolvedValue(mockSessionInstance)

      // Act
      const result = await repository.findByToken(sessionToken)

      // Assert
      expect(Session.findOne).toHaveBeenCalledWith({
        sessionToken,
        isActive: true,
        expiresAt: { $gt: expect.any(Date) },
      })
      expect(result).toBe(mockSessionInstance)
    })

    it('should return null when session not found', async () => {
      // Arrange
      const sessionToken = 'invalid-token'
      ;(Session.findOne as any).mockResolvedValue(null)

      // Act
      const result = await repository.findByToken(sessionToken)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('findByRefreshToken', () => {
    it('should find session by refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123'
      ;(Session.findOne as any).mockResolvedValue(mockSessionInstance)

      // Act
      const result = await repository.findByRefreshToken(refreshToken)

      // Assert
      expect(Session.findOne).toHaveBeenCalledWith({
        refreshToken,
        isActive: true,
        expiresAt: { $gt: expect.any(Date) },
      })
      expect(result).toBe(mockSessionInstance)
    })
  })


  describe('updateActivity', () => {
    it('should update session activity successfully', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011'
      const updatedSession = {
        ...mockSessionInstance,
        lastActivity: new Date(),
      }

      ;(Session.findByIdAndUpdate as any).mockResolvedValue(updatedSession)

      // Act
      const result = await repository.updateActivity(sessionId)

      // Assert
      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        sessionId,
        { lastActivity: expect.any(Date) },
        { new: true }
      )
      expect(result).toBe(updatedSession)
    })
  })

  describe('revoke', () => {
    it('should revoke session successfully', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011'
      const revokedSession = {
        ...mockSessionInstance,
        isActive: false,
      }

      ;(Session.findByIdAndUpdate as any).mockResolvedValue(revokedSession)

      // Act
      const result = await repository.revoke(sessionId)

      // Assert
      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        sessionId,
        { isActive: false },
        { new: true }
      )
      expect(result).toBe(true)
    })

    it('should return false when session not found', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011'

      ;(Session.findByIdAndUpdate as any).mockResolvedValue(null)

      // Act
      const result = await repository.revoke(sessionId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('revokeAllByUserId', () => {
    it('should revoke all sessions for user successfully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439012'

      ;(Session.updateMany as any).mockResolvedValue({ modifiedCount: 3 })

      // Act
      const result = await repository.revokeAllByUserId(userId)

      // Assert
      expect(Session.updateMany).toHaveBeenCalledWith(
        {
          userId: new Types.ObjectId(userId),
          isActive: true,
        },
        { isActive: false }
      )
      expect(result).toBe(3)
    })
  })

  describe('revokeExpired', () => {
    it('should revoke expired sessions successfully', async () => {
      // Arrange
      ;(Session.updateMany as any).mockResolvedValue({ modifiedCount: 5 })

      // Act
      const result = await repository.revokeExpired()

      // Assert
      expect(Session.updateMany).toHaveBeenCalledWith(
        {
          expiresAt: { $lt: expect.any(Date) },
          isActive: true,
        },
        { isActive: false }
      )
      expect(result).toBe(5)
    })
  })

  describe('deleteById', () => {
    it('should delete session successfully', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011'

      ;(Session.findByIdAndDelete as any).mockResolvedValue(mockSessionInstance)

      // Act
      const result = await repository.deleteById(sessionId)

      // Assert
      expect(Session.findByIdAndDelete).toHaveBeenCalledWith(sessionId)
      expect(result).toBe(true)
    })

    it('should return false when session not found', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011'

      ;(Session.findByIdAndDelete as any).mockResolvedValue(null)

      // Act
      const result = await repository.deleteById(sessionId)

      // Assert
      expect(result).toBe(false)
    })
  })
})

