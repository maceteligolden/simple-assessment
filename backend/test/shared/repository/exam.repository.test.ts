import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamRepository } from '../../../src/shared/repository/exam.repository'
import { Exam } from '../../../src/shared/model/exam.model'
import { Types } from 'mongoose'
import { EXAM_ATTEMPT_STATUS } from '../../../src/shared/constants'

// Mock the Exam model
vi.mock('../../../src/shared/model/exam.model', async () => {
  const { vi } = await import('vitest')
  const { Types } = await import('mongoose')

  const mockQuery = {
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    session: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  }

  class MockExam {
    _id: any
    title: string
    description: string
    duration: number
    creatorId: any
    availableAnytime: boolean
    randomizeQuestions: boolean
    showResultsImmediately: boolean
    isActive: boolean
    isDeleted: boolean
    questions: any[]
    createdAt: Date
    updatedAt: Date
    version: number
    save: any

    constructor(data: any) {
      this._id = data?._id || new Types.ObjectId('507f1f77bcf86cd799439011')
      this.title = data?.title || 'Test Exam'
      this.description = data?.description || 'Test Description'
      this.duration = data?.duration || 60
      this.creatorId = data?.creatorId || new Types.ObjectId('507f1f77bcf86cd799439012')
      this.availableAnytime = data?.availableAnytime ?? true
      this.randomizeQuestions = data?.randomizeQuestions ?? false
      this.showResultsImmediately = data?.showResultsImmediately ?? false
      this.isActive = data?.isActive ?? true
      this.isDeleted = data?.isDeleted ?? false
      this.questions = data?.questions || []
      this.createdAt = data?.createdAt || new Date()
      this.updatedAt = data?.updatedAt || new Date()
      this.version = data?.version || 0
      this.save = vi.fn().mockResolvedValue(true)
      Object.assign(this, data)
    }
  }

  MockExam.findOne = vi.fn().mockReturnValue(mockQuery)
  MockExam.find = vi.fn().mockReturnValue(mockQuery)
  MockExam.findById = vi.fn().mockReturnValue(mockQuery)
  MockExam.findByIdAndUpdate = vi.fn()
  MockExam.countDocuments = vi.fn()
  MockExam.aggregate = vi.fn()

  return {
    Exam: MockExam,
  }
})

// Mock ExamParticipant model
vi.mock('../../../src/shared/model/exam-participant.model', () => ({
  ExamParticipant: {
    countDocuments: vi.fn(),
  },
}))

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

describe('ExamRepository', () => {
  let repository: ExamRepository
  let mockQuery: any
  let mockExamInstance: any

  beforeEach(() => {
    repository = new ExamRepository()
    vi.clearAllMocks()
    
    mockQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      session: vi.fn().mockReturnThis(),
      exec: vi.fn(),
      then: vi.fn().mockImplementation(function(callback) {
        return Promise.resolve(this.exec()).then(callback);
      }),
    }
    
    mockExamInstance = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      title: 'Test Exam',
      description: 'Test Description',
      duration: 60,
      creatorId: new Types.ObjectId('507f1f77bcf86cd799439012'),
      availableAnytime: true,
      randomizeQuestions: false,
      showResultsImmediately: false,
      isActive: true,
      isDeleted: false,
      questions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
      save: vi.fn().mockResolvedValue(true),
    }
    
    ;(Exam.findOne as any).mockReturnValue(mockQuery)
    ;(Exam.find as any).mockReturnValue(mockQuery)
    ;(Exam.findById as any).mockReturnValue(mockQuery)
    mockQuery.populate.mockReturnThis()
    mockQuery.sort.mockReturnThis()
    mockQuery.select.mockReturnThis()
    mockQuery.session.mockReturnThis()
    mockQuery.exec.mockResolvedValue(null)
  })


  describe('findById', () => {
    it('should find exam by ID successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(mockExamInstance)

      // Act
      const result = await repository.findById(examId)

      // Assert
      expect(Exam.findOne).toHaveBeenCalledWith({
        _id: examId,
        isDeleted: false,
      })
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'questions',
        select: '_id type question options points order version',
      })
      expect(result).toBe(mockExamInstance)
    })
  })

  describe('findByIdForParticipant', () => {
    it('should find exam for participant with projection', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(mockExamInstance)

      // Act
      const result = await repository.findByIdForParticipant(examId)

      // Assert
      expect(Exam.findOne).toHaveBeenCalledWith({
        _id: examId,
        isDeleted: false,
      })
      expect(mockQuery.select).toHaveBeenCalledWith(
        '_id title description duration availableAnytime startDate endDate randomizeQuestions'
      )
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'questions',
        select: '_id type question options points order',
      })
      expect(result).toBe(mockExamInstance)
    })
  })

  describe('updateById', () => {
    it('should update exam successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const updateData = { title: 'Updated Exam' }
      const updatedExam = { ...mockExamInstance, ...updateData }

      ;(Exam.findByIdAndUpdate as any).mockResolvedValue(updatedExam)

      // Act
      const result = await repository.updateById(examId, updateData)

      // Assert
      expect(Exam.findByIdAndUpdate).toHaveBeenCalledWith(examId, updateData, {
        new: true,
        runValidators: true,
      })
      expect(result).toBe(updatedExam)
    })

    it('should handle optimistic locking', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const updateData = { title: 'Updated Exam' }
      const currentExam = { ...mockExamInstance, version: 1 }
      ;(Exam.findById as any).mockResolvedValue(currentExam)

      // Act & Assert
      await expect(
        repository.updateById(examId, updateData, { expectedVersion: 0 })
      ).rejects.toThrow('Exam was modified by another user')
    })
  })

  describe('deleteById', () => {
    it('should soft delete exam successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const deletedExam = { ...mockExamInstance, isDeleted: true, isActive: false }

      ;(Exam.findByIdAndUpdate as any).mockResolvedValue(deletedExam)

      // Act
      const result = await repository.deleteById(examId)

      // Assert
      expect(Exam.findByIdAndUpdate).toHaveBeenCalledWith(
        examId,
        { isDeleted: true, isActive: false },
        { new: true }
      )
      expect(result).toBe(true)
    })
  })

  describe('getQuestionCount', () => {
    it('should return question count using aggregation', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      ;(Exam.aggregate as any).mockResolvedValue([{ questionCount: 5 }])

      // Act
      const result = await repository.getQuestionCount(examId)

      // Assert
      expect(Exam.aggregate).toHaveBeenCalled()
      expect(result).toBe(5)
    })
  })

  describe('hasActiveAttempts', () => {
    it('should return true when exam has active attempts', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const { ExamAttempt } = await import('../../../src/shared/model/exam-attempt.model')

      ;(ExamAttempt.countDocuments as any).mockResolvedValue(1)

      // Act
      const result = await repository.hasActiveAttempts(examId)

      // Assert
      expect(ExamAttempt.countDocuments).toHaveBeenCalledWith({
        examId: new Types.ObjectId(examId),
        status: {
          $in: [EXAM_ATTEMPT_STATUS.IN_PROGRESS, EXAM_ATTEMPT_STATUS.SUBMITTED],
        },
      })
      expect(result).toBe(true)
    })
  })
})
