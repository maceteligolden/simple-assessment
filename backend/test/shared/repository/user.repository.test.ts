import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRepository } from '../../../src/shared/repository/user.repository'
import { User } from '../../../src/shared/model/user.model'
import { Types } from 'mongoose'

// Shared mock for tracking save calls
const mockSave = vi.fn()

// Mock the User model
vi.mock('../../../src/shared/model/user.model', async () => {
  const { vi } = await import('vitest')
  const { Types } = await import('mongoose')

  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  }

  class MockUser {
    _id: any
    email: string
    password: string
    role: string
    firstName: string
    lastName: string
    save: any
    toObject: any

    constructor(data: any) {
      this._id = data?._id || new Types.ObjectId('507f1f77bcf86cd799439011')
      this.email = data?.email || 'test@example.com'
      this.password = data?.password || 'hashedPassword'
      this.role = data?.role || 'participant'
      this.firstName = data?.firstName || 'Test'
      this.lastName = data?.lastName || 'User'
      this.save = mockSave.mockResolvedValue(this)
      this.toObject = vi.fn().mockReturnValue(this)
      Object.assign(this, data)
    }
  }

  MockUser.findById = vi.fn().mockReturnValue(mockQuery)
  MockUser.findOne = vi.fn().mockReturnValue(mockQuery)
  MockUser.findByIdAndUpdate = vi.fn()
  MockUser.findByIdAndDelete = vi.fn()

  return {
    User: MockUser,
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

describe('UserRepository', () => {
  let repository: UserRepository
  let mockQuery: any
  let mockUserInstance: any

  beforeEach(() => {
    repository = new UserRepository()
    vi.clearAllMocks()
    mockSave.mockReset()
    
    // Create fresh mock query
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    }
    
    mockUserInstance = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'participant',
      firstName: 'Test',
      lastName: 'User',
      save: vi.fn().mockResolvedValue(true),
      toObject: vi.fn().mockReturnValue({}),
    }
    
    // Reset query chain mocks
    ;(User.findById as any).mockReturnValue(mockQuery)
    ;(User.findOne as any).mockReturnValue(mockQuery)
    mockQuery.select.mockReturnThis()
    mockQuery.exec.mockResolvedValue(null)
  })


  describe('findById', () => {
    it('should find user by ID without password and refresh token', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(mockUserInstance)

      // Act
      const result = await repository.findById(userId)

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId)
      expect(mockQuery.select).not.toHaveBeenCalled()
      expect(mockQuery.exec).toHaveBeenCalled()
      expect(result).toBe(mockUserInstance)
    })

    it('should find user by ID with password', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(mockUserInstance)

      // Act
      const result = await repository.findById(userId, true)

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId)
      expect(mockQuery.select).toHaveBeenCalledWith('+password')
      expect(mockQuery.exec).toHaveBeenCalled()
      expect(result).toBe(mockUserInstance)
    })

    it('should find user by ID with refresh token', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(mockUserInstance)

      // Act
      const result = await repository.findById(userId, false, true)

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId)
      expect(mockQuery.select).toHaveBeenCalledWith('+refreshToken')
      expect(mockQuery.exec).toHaveBeenCalled()
      expect(result).toBe(mockUserInstance)
    })

    it('should return null when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(null)

      // Act
      const result = await repository.findById(userId)

      // Assert
      expect(result).toBeNull()
    })

    it('should throw error when query fails', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      const mockError = new Error('Database error')
      mockQuery.exec.mockRejectedValue(mockError)

      // Act & Assert
      await expect(repository.findById(userId)).rejects.toThrow('Database error')
    })
  })

  describe('findByEmail', () => {
    it('should find user by email without password', async () => {
      // Arrange
      const email = 'test@example.com'
      mockQuery.exec.mockResolvedValue(mockUserInstance)

      // Act
      const result = await repository.findByEmail(email)

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email })
      expect(mockQuery.select).not.toHaveBeenCalled()
      expect(mockQuery.exec).toHaveBeenCalled()
      expect(result).toBe(mockUserInstance)
    })

    it('should find user by email with password', async () => {
      // Arrange
      const email = 'test@example.com'
      mockQuery.exec.mockResolvedValue(mockUserInstance)

      // Act
      const result = await repository.findByEmail(email, true)

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email })
      expect(mockQuery.select).toHaveBeenCalledWith('+password')
      expect(mockQuery.exec).toHaveBeenCalled()
      expect(result).toBe(mockUserInstance)
    })

    it('should return null when user not found', async () => {
      // Arrange
      const email = 'notfound@example.com'
      mockQuery.exec.mockResolvedValue(null)

      // Act
      const result = await repository.findByEmail(email)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('findOne', () => {
    it('should find user by filters', async () => {
      // Arrange
      const filters = { email: 'test@example.com', role: 'participant' }
      mockQuery.exec.mockResolvedValue(mockUserInstance)

      // Act
      const result = await repository.findOne(filters)

      // Assert
      expect(User.findOne).toHaveBeenCalledWith(filters)
      expect(mockQuery.exec).toHaveBeenCalled()
      expect(result).toBe(mockUserInstance)
    })

    it('should return null when user not found', async () => {
      // Arrange
      const filters = { email: 'notfound@example.com' }
      mockQuery.exec.mockResolvedValue(null)

      // Act
      const result = await repository.findOne(filters)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateById', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      const updateData = { email: 'updated@example.com' }
      const updatedUser = { ...mockUserInstance, ...updateData }

      ;(User.findByIdAndUpdate as any).mockResolvedValue(updatedUser)

      // Act
      const result = await repository.updateById(userId, updateData)

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, {
        new: true,
        runValidators: true,
      })
      expect(result).toBe(updatedUser)
    })

    it('should return null when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      const updateData = { email: 'updated@example.com' }

      ;(User.findByIdAndUpdate as any).mockResolvedValue(null)

      // Act
      const result = await repository.updateById(userId, updateData)

      // Assert
      expect(result).toBeNull()
    })

    it('should throw error when update fails', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      const updateData = { email: 'updated@example.com' }
      const mockError = new Error('Update failed')

      ;(User.findByIdAndUpdate as any).mockRejectedValue(mockError)

      // Act & Assert
      await expect(repository.updateById(userId, updateData)).rejects.toThrow(
        'Update failed'
      )
    })
  })

  describe('create', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'participant' as const,
      }
      mockSave.mockResolvedValue({ _id: new Types.ObjectId() })

      // Act
      const result = await repository.create(userData)

      // Assert
      expect(result).toBeDefined()
      expect(mockSave).toHaveBeenCalled()
    })

    it('should create a user with session', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'participant' as const,
      }
      const mockSession = { id: 'mock-session' } as any
      mockSave.mockResolvedValue({ _id: new Types.ObjectId() })

      // Act
      await repository.create(userData, { session: mockSession })

      // Assert
      expect(mockSave).toHaveBeenCalledWith({
        session: mockSession,
      })
    })
  })

  describe('updateRefreshToken', () => {
    it('should update refresh token successfully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      const refreshToken = 'new-refresh-token'
      const updatedUser = { ...mockUserInstance, refreshToken }

      ;(User.findByIdAndUpdate as any).mockResolvedValue(updatedUser)

      // Act
      const result = await repository.updateRefreshToken(userId, refreshToken)

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { refreshToken },
        { new: true }
      )
      expect(result).toBe(updatedUser)
    })

    it('should update refresh token with session', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      const refreshToken = 'new-refresh-token'
      const mockSession = { id: 'mock-session' } as any

      ;(User.findByIdAndUpdate as any).mockResolvedValue(mockUserInstance)

      // Act
      await repository.updateRefreshToken(userId, refreshToken, {
        session: mockSession,
      })

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { refreshToken },
        { new: true, session: mockSession }
      )
    })
  })

  describe('deleteById', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'

      ;(User.findByIdAndDelete as any).mockResolvedValue(mockUserInstance)

      // Act
      const result = await repository.deleteById(userId)

      // Assert
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(userId)
      expect(result).toBe(true)
    })

    it('should return false when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'

      ;(User.findByIdAndDelete as any).mockResolvedValue(null)

      // Act
      const result = await repository.deleteById(userId)

      // Assert
      expect(result).toBe(false)
    })

    it('should throw error when delete fails', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011'
      const mockError = new Error('Delete failed')

      ;(User.findByIdAndDelete as any).mockRejectedValue(mockError)

      // Act & Assert
      await expect(repository.deleteById(userId)).rejects.toThrow('Delete failed')
    })
  })
})

