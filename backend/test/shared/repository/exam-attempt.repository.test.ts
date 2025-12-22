import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamAttemptRepository } from '../../../src/shared/repository/exam-attempt.repository'
import { ExamAttempt } from '../../../src/shared/model/exam-attempt.model'
import { Types } from 'mongoose'

// Mock the ExamAttempt model
vi.mock('../../../src/shared/model/exam-attempt.model', async () => {
  const { vi } = await import('vitest')
  const { Types } = await import('mongoose')

  const mockQuery = {
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  }

  class MockExamAttempt {
    _id: any
    examId: any
    participantId: any
    userId: any
    status: string
    questionOrder: number[]
    currentQuestionIndex: number
    answers: Map<string, any>
    answeredQuestions: number[]
    startedAt: Date
    lastActivityAt: Date
    save: any

    constructor(data: any) {
      this._id = data?._id || new Types.ObjectId('507f1f77bcf86cd799439011')
      this.examId = data?.examId || new Types.ObjectId('507f1f77bcf86cd799439012')
      this.participantId = data?.participantId || new Types.ObjectId('507f1f77bcf86cd799439013')
      this.userId = data?.userId || new Types.ObjectId('507f1f77bcf86cd799439014')
      this.status = data?.status || 'in-progress'
      this.questionOrder = data?.questionOrder || [0, 1, 2]
      this.currentQuestionIndex = data?.currentQuestionIndex ?? 0
      this.answers = data?.answers || new Map()
      this.answeredQuestions = data?.answeredQuestions || []
      this.startedAt = data?.startedAt || new Date()
      this.lastActivityAt = data?.lastActivityAt || new Date()
      this.save = vi.fn().mockResolvedValue(true)
      Object.assign(this, data)
    }
  }

  MockExamAttempt.findById = vi.fn().mockReturnValue(mockQuery)
  MockExamAttempt.findOne = vi.fn().mockReturnValue(mockQuery)
  MockExamAttempt.find = vi.fn().mockReturnValue(mockQuery)
  MockExamAttempt.findByIdAndUpdate = vi.fn()

  return {
    ExamAttempt: MockExamAttempt,
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

describe('ExamAttemptRepository', () => {
  let repository: ExamAttemptRepository
  let mockQuery: any
  let mockAttemptInstance: any

  beforeEach(() => {
    repository = new ExamAttemptRepository()
    vi.clearAllMocks()
    
    mockQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    }
    
    mockAttemptInstance = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      examId: new Types.ObjectId('507f1f77bcf86cd799439012'),
      participantId: new Types.ObjectId('507f1f77bcf86cd799439013'),
      userId: new Types.ObjectId('507f1f77bcf86cd799439014'),
      status: 'in-progress',
      questionOrder: [0, 1, 2],
      currentQuestionIndex: 0,
      answers: new Map(),
      answeredQuestions: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      save: vi.fn().mockResolvedValue(true),
    }
    
    ;(ExamAttempt.findById as any).mockReturnValue(mockQuery)
    ;(ExamAttempt.findOne as any).mockReturnValue(mockQuery)
    ;(ExamAttempt.find as any).mockReturnValue(mockQuery)
    mockQuery.populate.mockReturnThis()
    mockQuery.sort.mockReturnThis()
    mockQuery.exec.mockResolvedValue(null)
  })


  describe('findByExamAndUser', () => {
    it('should find attempt by exam and user successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const userId = '507f1f77bcf86cd799439014'
      ;(ExamAttempt.findOne as any).mockResolvedValue(mockAttemptInstance)

      // Act
      const result = await repository.findByExamAndUser(examId, userId)

      // Assert
      expect(ExamAttempt.findOne).toHaveBeenCalledWith({
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
      })
      expect(result).toBe(mockAttemptInstance)
    })
  })


  describe('updateById', () => {
    it('should update attempt successfully', async () => {
      // Arrange
      const attemptId = '507f1f77bcf86cd799439011'
      const updateData = { status: 'submitted' }
      const updatedAttempt = { ...mockAttemptInstance, ...updateData }

      ;(ExamAttempt.findByIdAndUpdate as any).mockResolvedValue(updatedAttempt)

      // Act
      const result = await repository.updateById(attemptId, updateData)

      // Assert
      expect(ExamAttempt.findByIdAndUpdate).toHaveBeenCalledWith(attemptId, updateData, {
        new: true,
        runValidators: true,
      })
      expect(result).toBe(updatedAttempt)
    })
  })

  describe('updateAnswer', () => {
    it('should update answer successfully', async () => {
      // Arrange
      const attemptId = '507f1f77bcf86cd799439011'
      const questionId = '507f1f77bcf86cd799439015'
      const answer = 'Option A'

      const answersMap = new Map()
      const mockAttempt = {
        ...mockAttemptInstance,
        currentQuestionIndex: 0,
        answeredQuestions: [],
        answers: answersMap,
        save: vi.fn().mockResolvedValue(true),
      }

      // Mock Map.set method
      answersMap.set = vi.fn()

      ;(ExamAttempt.findById as any).mockResolvedValue(mockAttempt)

      // Act
      const result = await repository.updateAnswer(attemptId, questionId, answer)

      // Assert
      expect(ExamAttempt.findById).toHaveBeenCalledWith(attemptId)
      expect(answersMap.set).toHaveBeenCalled()
      expect(mockAttempt.save).toHaveBeenCalled()
      expect(result).toBe(mockAttempt)
    })

    it('should return null when attempt not found', async () => {
      // Arrange
      const attemptId = '507f1f77bcf86cd799439011'
      const questionId = '507f1f77bcf86cd799439015'
      const answer = 'Option A'

      ;(ExamAttempt.findById as any).mockResolvedValue(null)

      // Act
      const result = await repository.updateAnswer(attemptId, questionId, answer)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('markAsAbandoned', () => {
    it('should mark attempt as abandoned successfully', async () => {
      // Arrange
      const attemptId = '507f1f77bcf86cd799439011'
      const abandonedAttempt = {
        ...mockAttemptInstance,
        status: 'abandoned',
        abandonedAt: new Date(),
      }

      ;(ExamAttempt.findByIdAndUpdate as any).mockResolvedValue(abandonedAttempt)

      // Act
      const result = await repository.markAsAbandoned(attemptId)

      // Assert
      expect(ExamAttempt.findByIdAndUpdate).toHaveBeenCalledWith(
        attemptId,
        {
          status: 'abandoned',
          abandonedAt: expect.any(Date),
        },
        { new: true }
      )
      expect(result).toBe(true)
    })

    it('should return false when attempt not found', async () => {
      // Arrange
      const attemptId = '507f1f77bcf86cd799439011'

      ;(ExamAttempt.findByIdAndUpdate as any).mockResolvedValue(null)

      // Act
      const result = await repository.markAsAbandoned(attemptId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('updateActivity', () => {
    it('should update attempt activity successfully', async () => {
      // Arrange
      const attemptId = '507f1f77bcf86cd799439011'
      const updatedAttempt = {
        ...mockAttemptInstance,
        lastActivityAt: new Date(),
      }

      ;(ExamAttempt.findByIdAndUpdate as any).mockResolvedValue(updatedAttempt)

      // Act
      const result = await repository.updateActivity(attemptId)

      // Assert
      expect(ExamAttempt.findByIdAndUpdate).toHaveBeenCalledWith(
        attemptId,
        { lastActivityAt: expect.any(Date) },
        { new: true }
      )
      expect(result).toBe(updatedAttempt)
    })
  })

  describe('findByUserId', () => {
    it('should find attempts by user ID successfully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439014'
      const mockAttempts = [mockAttemptInstance]
      const mockFindQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockAttempts),
      }

      ;(ExamAttempt.find as any).mockReturnValue(mockFindQuery)

      // Act
      const result = await repository.findByUserId(userId)

      // Assert
      expect(ExamAttempt.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId),
      })
      expect(mockFindQuery.populate).toHaveBeenCalledWith('examId')
      expect(mockFindQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toBe(mockAttempts)
    })
  })
})

