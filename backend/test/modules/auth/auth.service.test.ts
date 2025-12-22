import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../../../src/modules/auth/auth.service'
import { IUserRepository } from '../../../src/shared/repository/user.repository'
import { ConflictError, UnauthorizedError } from '../../../src/shared/errors'
import * as passwordUtil from '../../../src/shared/util/password'
import * as jwtUtil from '../../../src/shared/util/jwt'
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

// Mock repository
const mockUserRepository: IUserRepository = {
  findByEmail: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  updateById: vi.fn(),
  updateRefreshToken: vi.fn(),
  deleteById: vi.fn(),
  findOne: vi.fn(),
}

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    authService = new AuthService(mockUserRepository)
  })

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
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
      }

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(passwordUtil.hashPassword).mockResolvedValue('hashed-password')
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser)
      vi.mocked(jwtUtil.generateTokens).mockReturnValue(mockTokens)

      // Act
      const result = await authService.signUp(signUpInput)

      // Assert
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe(signUpInput.email)
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        signUpInput.email
      )
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(
        signUpInput.password
      )
      expect(mockUserRepository.create).toHaveBeenCalled()
      expect(jwtUtil.generateTokens).toHaveBeenCalled()
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
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser)

      // Act & Assert
      await expect(authService.signUp(signUpInput)).rejects.toThrow(
        ConflictError
      )
      expect(mockUserRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    it('should sign in user with valid credentials', async () => {
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
      }

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
      vi.mocked(passwordUtil.comparePassword).mockResolvedValue(true)
      vi.mocked(jwtUtil.generateTokens).mockReturnValue(mockTokens)

      // Act
      const result = await authService.signIn(signInInput)

      // Assert
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe(signInInput.email)
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        signInInput.email,
        true
      )
      expect(passwordUtil.comparePassword).toHaveBeenCalledWith(
        signInInput.password,
        mockUser.password
      )
    })

    it('should throw UnauthorizedError with invalid email', async () => {
      // Arrange
      const signInInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

      // Act & Assert
      await expect(authService.signIn(signInInput)).rejects.toThrow(
        UnauthorizedError
      )
      expect(passwordUtil.comparePassword).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError with invalid password', async () => {
      // Arrange
      const signInInput = {
        email: 'john.doe@example.com',
        password: 'wrongpassword',
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
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
      vi.mocked(passwordUtil.comparePassword).mockResolvedValue(false)

      // Act & Assert
      await expect(authService.signIn(signInInput)).rejects.toThrow(
        UnauthorizedError
      )
      expect(passwordUtil.comparePassword).toHaveBeenCalled()
    })
  })
})
