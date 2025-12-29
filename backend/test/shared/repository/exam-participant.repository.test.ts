import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamParticipantRepository } from '../../../src/shared/repository/exam-participant.repository'
import { ExamParticipant } from '../../../src/shared/model/exam-participant.model'
import { Types } from 'mongoose'
import { EXAM_ATTEMPT_STATUS } from '../../../src/shared/constants'

// Mock the ExamParticipant model
vi.mock('../../../src/shared/model/exam-participant.model', async () => {
  const { vi } = await import('vitest')
  const { Types } = await import('mongoose')

  const mockQuery = {
    sort: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    session: vi.fn().mockReturnThis(),
    exec: vi.fn(),
    then: vi.fn().mockImplementation(function(callback) {
      return Promise.resolve(this.exec()).then(callback);
    }),
  }

  class MockExamParticipant {
    _id: any
    examId: any
    userId: any
    email: string
    accessCode: string
    isUsed: boolean
    addedAt: Date
    save: any

    constructor(data: any) {
      this._id = data?._id || new Types.ObjectId('507f1f77bcf86cd799439011')
      this.examId = data?.examId || new Types.ObjectId('507f1f77bcf86cd799439012')
      this.userId = data?.userId || new Types.ObjectId('507f1f77bcf86cd799439013')
      this.email = data?.email || 'participant@example.com'
      this.accessCode = data?.accessCode || 'ABC123'
      this.isUsed = data?.isUsed ?? false
      this.addedAt = data?.addedAt || new Date()
      this.save = vi.fn().mockResolvedValue(true)
      Object.assign(this, data)
    }
  }

  MockExamParticipant.findById = vi.fn().mockReturnValue(mockQuery)
  MockExamParticipant.findOne = vi.fn().mockReturnValue(mockQuery)
  MockExamParticipant.find = vi.fn().mockReturnValue(mockQuery)
  MockExamParticipant.findByIdAndUpdate = vi.fn()
  MockExamParticipant.findByIdAndDelete = vi.fn()

  return {
    ExamParticipant: MockExamParticipant,
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

// Mock ExamAttempt model
vi.mock('../../../src/shared/model/exam-attempt.model', () => ({
  ExamAttempt: {
    countDocuments: vi.fn(),
  },
}))

describe('ExamParticipantRepository', () => {
  let repository: ExamParticipantRepository
  let mockQuery: any
  let mockParticipantInstance: any

  beforeEach(() => {
    repository = new ExamParticipantRepository()
    vi.clearAllMocks()
    
    mockQuery = {
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      session: vi.fn().mockReturnThis(),
      exec: vi.fn(),
      then: vi.fn().mockImplementation(function(callback) {
        return Promise.resolve(this.exec()).then(callback);
      }),
    }
    
    mockParticipantInstance = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      examId: new Types.ObjectId('507f1f77bcf86cd799439012'),
      userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
      email: 'participant@example.com',
      accessCode: 'ABC123',
      isUsed: false,
      addedAt: new Date(),
      save: vi.fn().mockResolvedValue(true),
    }
    
    ;(ExamParticipant.findById as any).mockReturnValue(mockQuery)
    ;(ExamParticipant.findOne as any).mockReturnValue(mockQuery)
    ;(ExamParticipant.find as any).mockReturnValue(mockQuery)
    mockQuery.sort.mockReturnThis()
    mockQuery.populate.mockReturnThis()
    mockQuery.session.mockReturnThis()
    mockQuery.exec.mockResolvedValue(null)
  })


  describe('findById', () => {
    it('should find participant by ID successfully', async () => {
      // Arrange
      const participantId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(mockParticipantInstance)

      // Act
      const result = await repository.findById(participantId)

      // Assert
      expect(ExamParticipant.findById).toHaveBeenCalledWith(participantId)
      expect(result).toBe(mockParticipantInstance)
    })
  })


  describe('findByAccessCode', () => {
    it('should find participant by access code successfully', async () => {
      // Arrange
      const accessCode = 'ABC123'
      mockQuery.exec.mockResolvedValue(mockParticipantInstance)

      // Act
      const result = await repository.findByAccessCode(accessCode)

      // Assert
      expect(ExamParticipant.findOne).toHaveBeenCalledWith({
        accessCode: 'ABC123',
      })
      expect(result).toBe(mockParticipantInstance)
    })
  })

  describe('findByExamAndUser', () => {
    it('should find participant by exam and user successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const userId = '507f1f77bcf86cd799439013'
      mockQuery.exec.mockResolvedValue(mockParticipantInstance)

      // Act
      const result = await repository.findByExamAndUser(examId, userId)

      // Assert
      expect(ExamParticipant.findOne).toHaveBeenCalledWith({
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
      })
      expect(result).toBe(mockParticipantInstance)
    })
  })

  describe('markAsUsed', () => {
    it('should mark participant as used successfully', async () => {
      // Arrange
      const participantId = '507f1f77bcf86cd799439011'
      const updatedParticipant = { ...mockParticipantInstance, isUsed: true }

      ;(ExamParticipant.findByIdAndUpdate as any).mockResolvedValue(updatedParticipant)

      // Act
      const result = await repository.markAsUsed(participantId)

      // Assert
      expect(ExamParticipant.findByIdAndUpdate).toHaveBeenCalledWith(
        participantId,
        { isUsed: true },
        { new: true }
      )
      expect(result).toBe(true)
    })
  })

  describe('deleteById', () => {
    it('should delete participant successfully', async () => {
      // Arrange
      const participantId = '507f1f77bcf86cd799439011'

      ;(ExamParticipant.findByIdAndDelete as any).mockResolvedValue(mockParticipantInstance)

      // Act
      const result = await repository.deleteById(participantId)

      // Assert
      expect(ExamParticipant.findByIdAndDelete).toHaveBeenCalledWith(participantId, {})
      expect(result).toBe(true)
    })
  })

  describe('hasStartedAttempt', () => {
    it('should return true when participant has started attempt', async () => {
      // Arrange
      const participantId = '507f1f77bcf86cd799439011'
      const { ExamAttempt } = await import('../../../src/shared/model/exam-attempt.model')

      ;(ExamAttempt.countDocuments as any).mockResolvedValue(1)

      // Act
      const result = await repository.hasStartedAttempt(participantId)

      // Assert
      expect(ExamAttempt.countDocuments).toHaveBeenCalledWith({
        participantId: new Types.ObjectId(participantId),
        status: { $ne: EXAM_ATTEMPT_STATUS.NOT_STARTED },
      })
      expect(result).toBe(true)
    })
  })
})
