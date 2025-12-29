import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../../../src/modules/auth/auth.service'
import { IUserRepository } from '../../../src/shared/repository/user.repository'
import { ISessionService } from '../../../src/shared/service/session.service'
import { IAuthCacheService } from '../../../src/modules/auth/cache'
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../../src/shared/errors'
import * as passwordUtil from '../../../src/shared/util/password'
import * as jwtUtil from '../../../src/shared/util/jwt'
import { TransactionManager, Sanitizer } from '../../../src/shared/util'
import { Types } from 'mongoose'
import { IUser } from '../../../src/shared/model/user.model'

// Mock password utilities
vi.mock('../../../src/shared/util/password', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}))

// Mock JWT utilities
vi.mock('../../../src/shared/util/jwt', () => ({
  generateTokens: vi.fn(),
  verifyRefreshToken: vi.fn(),
}))

// Mock Sanitizer
vi.mock('../../../src/shared/util/sanitizer', () => ({
  Sanitizer: {
    sanitize: vi.fn(val => val),
  },
}))

// Mock TransactionManager
import { TransactionManager } from '../../../src/shared/util/transaction.manager'
vi.mock('../../../src/shared/util/transaction.manager', () => ({
  TransactionManager: {
    withTransaction: vi.fn(cb => cb('mock-session')),
  },
}))

// Mock repositories and services
const mockUserRepository: IUserRepository = {
  findByEmail: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  updateById: vi.fn(),
  updateRefreshToken: vi.fn(),
  deleteById: vi.fn(),
  findOne: vi.fn(),
}

const mockSessionService: ISessionService = {
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllUserSessions: vi.fn(),
  validateSession: vi.fn(),
  refreshSession: vi.fn(),
  cleanupExpiredSessions: vi.fn(),
}

const mockAuthCache: IAuthCacheService = {
  getUserById: vi.fn(),
  setUserById: vi.fn(),
  invalidateUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  setUserByEmail: vi.fn(),
  invalidateUserByEmail: vi.fn(),
  invalidateUserProfile: vi.fn(),
  wrapUserProfile: vi.fn(),
  wrapUserById: vi.fn(),
  wrapUserByEmail: vi.fn(),
}

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    authService = new AuthService(
      mockUserRepository,
      mockSessionService,
      mockAuthCache
    )
  })

  describe('signUp', () => {
    it('should create a new user successfully with transaction and session', async () => {
      // Arrange
      const signUpInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'participant' as const,
      }

      const mockUser: IUser = {
        _id: new Types.ObjectId(),
        email: signUpInput.email,
        firstName: signUpInput.firstName,
        lastName: signUpInput.lastName,
        role: signUpInput.role,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      const mockSession = {
        _id: new Types.ObjectId(),
        sessionToken: 'session-token',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(passwordUtil.hashPassword).mockResolvedValue('hashed-password')
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser)
      vi.mocked(jwtUtil.generateTokens).mockReturnValue(mockTokens)
      vi.mocked(mockUserRepository.updateRefreshToken).mockResolvedValue(
        mockUser
      )
      vi.mocked(mockSessionService.createSession).mockResolvedValue(
        mockSession as any
      )

      // Act
      const result = await authService.signUp(signUpInput, { ip: '127.0.0.1' })

      // Assert
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result).toHaveProperty('sessionToken', 'session-token')
      expect(result.user.email).toBe(signUpInput.email)

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        signUpInput.email
      )
      expect(Sanitizer.sanitize).toHaveBeenCalledTimes(2)
      expect(TransactionManager.withTransaction).toHaveBeenCalled()
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.anything(),
        { session: 'mock-session' }
      )
      expect(mockUserRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser._id.toString(),
        mockTokens.refreshToken,
        { session: 'mock-session' }
      )
      expect(mockSessionService.createSession).toHaveBeenCalled()
    })

    it('should throw ConflictError if email already exists', async () => {
      // Arrange
      const signUpInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        role: 'participant' as const,
      }

      const existingUser: IUser = {
        _id: new Types.ObjectId(),
        email: signUpInput.email,
        firstName: 'Existing',
        lastName: 'User',
        role: 'participant',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser)

      // Act & Assert
      await expect(authService.signUp(signUpInput)).rejects.toThrow(
        ConflictError
      )
      expect(TransactionManager.withTransaction).not.toHaveBeenCalled()
    })

    it('should throw ConflictError if email exists with different role', async () => {
      // Arrange
      const signUpInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        role: 'participant' as const,
      }

      const existingUser: IUser = {
        _id: new Types.ObjectId(),
        email: signUpInput.email,
        firstName: 'Existing',
        lastName: 'User',
        role: 'examiner',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser)

      // Act & Assert
      await expect(authService.signUp(signUpInput)).rejects.toThrow(
        ConflictError
      )
      await expect(authService.signUp(signUpInput)).rejects.toThrow(
        /already registered as examiner/
      )
    })
  })

  describe('signIn', () => {
    it('should sign in user and create session', async () => {
      // Arrange
      const signInInput = {
        email: 'john.doe@example.com',
        password: 'password123',
      }

      const mockUser: IUser = {
        _id: new Types.ObjectId(),
        email: signInInput.email,
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'participant',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      const mockSession = {
        _id: new Types.ObjectId(),
        sessionToken: 'session-token',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
      vi.mocked(passwordUtil.comparePassword).mockResolvedValue(true)
      vi.mocked(jwtUtil.generateTokens).mockReturnValue(mockTokens)
      vi.mocked(mockSessionService.createSession).mockResolvedValue(
        mockSession as any
      )

      // Act
      const result = await authService.signIn(signInInput, { ip: '127.0.0.1' })

      // Assert
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result).toHaveProperty('sessionToken', 'session-token')
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        signInInput.email,
        true
      )
      expect(mockSessionService.createSession).toHaveBeenCalled()
    })

    it('should throw UnauthorizedError with invalid credentials', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

      await expect(
        authService.signIn({ email: 'test@test.com', password: 'pw' })
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('signOut', () => {
    it('should revoke session', async () => {
      await authService.signOut('session-id')
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        'session-id'
      )
    })
  })

  describe('signOutAll', () => {
    it('should revoke all user sessions', async () => {
      vi.mocked(mockSessionService.revokeAllUserSessions).mockResolvedValue(5)
      const count = await authService.signOutAll('user-id')
      expect(count).toBe(5)
      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-id'
      )
    })
  })

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser: IUser = {
        _id: new Types.ObjectId(),
        email: 'test@test.com',
        refreshToken: 'old-refresh-token',
        firstName: 'Test',
        lastName: 'User',
        role: 'participant',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any

      vi.mocked(jwtUtil.verifyRefreshToken).mockReturnValue({
        userId: 'user-id',
      })
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)
      vi.mocked(jwtUtil.generateTokens).mockReturnValue({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      })
      vi.mocked(mockUserRepository.updateRefreshToken).mockResolvedValue(
        mockUser
      )

      const result = await authService.refreshToken({
        refreshToken: 'old-refresh-token',
      })

      expect(result.accessToken).toBe('new-at')
      expect(result.refreshToken).toBe('new-rt')
      expect(mockUserRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'new-rt'
      )
    })

    it('should throw UnauthorizedError if tokens do not match', async () => {
      const mockUser: IUser = {
        _id: new Types.ObjectId(),
        refreshToken: 'different-token',
      } as any

      vi.mocked(jwtUtil.verifyRefreshToken).mockReturnValue({
        userId: 'user-id',
      })
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      await expect(
        authService.refreshToken({ refreshToken: 'provided-token' })
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('getUserById', () => {
    it('should use cache wrap to get user', async () => {
      vi.mocked(mockAuthCache.wrapUserById).mockImplementation(
        (id, fetcher) => fetcher() as any
      )
      vi.mocked(mockUserRepository.findById).mockResolvedValue({
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@test.com',
      } as any)

      const result = await authService.getUserById('507f1f77bcf86cd799439011')

      expect(result.email).toBe('test@test.com')
      expect(mockAuthCache.wrapUserById).toHaveBeenCalled()
    })

    it('should throw NotFoundError if user not found', async () => {
      vi.mocked(mockAuthCache.wrapUserById).mockImplementation(
        (id, fetcher) => fetcher() as any
      )
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      await expect(authService.getUserById('user-id')).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('searchUserByEmail', () => {
    it('should use cache wrap to search user', async () => {
      vi.mocked(mockAuthCache.wrapUserByEmail).mockImplementation(
        (email, fetcher) => fetcher() as any
      )
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        _id: new Types.ObjectId(),
        email: 'test@test.com',
      } as any)

      const result = await authService.searchUserByEmail('TEST@test.com ')

      expect(result?.email).toBe('test@test.com')
      expect(mockAuthCache.wrapUserByEmail).toHaveBeenCalledWith(
        'test@test.com',
        expect.any(Function)
      )
    })
  })
})
