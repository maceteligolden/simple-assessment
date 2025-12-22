import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamRepository } from '../../../src/shared/repository/exam.repository'
import { Exam } from '../../../src/shared/model/exam.model'
import { Types } from 'mongoose'

// Mock the Exam model
vi.mock('../../../src/shared/model/exam.model', async () => {
  const { vi } = await import('vitest')
  const { Types } = await import('mongoose')

  const mockQuery = {
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
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
      this.save = vi.fn().mockResolvedValue(true)
      Object.assign(this, data)
    }
  }

  MockExam.findOne = vi.fn().mockReturnValue(mockQuery)
  MockExam.find = vi.fn().mockReturnValue(mockQuery)
  MockExam.findByIdAndUpdate = vi.fn()
  MockExam.countDocuments = vi.fn()

  return {
    Exam: MockExam,
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
      exec: vi.fn(),
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
      save: vi.fn().mockResolvedValue(true),
    }
    
    ;(Exam.findOne as any).mockReturnValue(mockQuery)
    ;(Exam.find as any).mockReturnValue(mockQuery)
    mockQuery.populate.mockReturnThis()
    mockQuery.sort.mockReturnThis()
    mockQuery.exec.mockResolvedValue(null)
  })


  describe('findById', () => {
    it('should find exam by ID successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const mockFindOneQuery = {
        populate: vi.fn().mockResolvedValue(mockExamInstance),
      }

      ;(Exam.findOne as any).mockReturnValue(mockFindOneQuery)

      // Act
      const result = await repository.findById(examId)

      // Assert
      expect(Exam.findOne).toHaveBeenCalledWith({
        _id: examId,
        isDeleted: false,
      })
      expect(mockFindOneQuery.populate).toHaveBeenCalledWith('questions')
      expect(result).toBe(mockExamInstance)
    })

    it('should return null when exam not found', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const mockFindOneQuery = {
        populate: vi.fn().mockResolvedValue(null),
      }

      ;(Exam.findOne as any).mockReturnValue(mockFindOneQuery)

      // Act
      const result = await repository.findById(examId)

      // Assert
      expect(result).toBeNull()
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

    it('should return null when exam not found', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const updateData = { title: 'Updated Exam' }

      ;(Exam.findByIdAndUpdate as any).mockResolvedValue(null)

      // Act
      const result = await repository.updateById(examId, updateData)

      // Assert
      expect(result).toBeNull()
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

    it('should return false when exam not found', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'

      ;(Exam.findByIdAndUpdate as any).mockResolvedValue(null)

      // Act
      const result = await repository.deleteById(examId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('addQuestion', () => {
    it('should add question to exam successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const questionId = '507f1f77bcf86cd799439013'
      const updatedExam = { ...mockExamInstance }

      ;(Exam.findByIdAndUpdate as any).mockResolvedValue(updatedExam)

      // Act
      const result = await repository.addQuestion(examId, questionId)

      // Assert
      expect(Exam.findByIdAndUpdate).toHaveBeenCalledWith(
        examId,
        { $addToSet: { questions: new Types.ObjectId(questionId) } },
        { new: true }
      )
      expect(result).toBe(updatedExam)
    })
  })

  describe('removeQuestion', () => {
    it('should remove question from exam successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const questionId = '507f1f77bcf86cd799439013'
      const updatedExam = { ...mockExamInstance }

      ;(Exam.findByIdAndUpdate as any).mockResolvedValue(updatedExam)

      // Act
      const result = await repository.removeQuestion(examId, questionId)

      // Assert
      expect(Exam.findByIdAndUpdate).toHaveBeenCalledWith(
        examId,
        { $pull: { questions: new Types.ObjectId(questionId) } },
        { new: true }
      )
      expect(result).toBe(updatedExam)
    })
  })

  describe('reorderQuestions', () => {
    it('should reorder questions successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const questionIds = ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014']
      const updatedExam = { ...mockExamInstance }

      ;(Exam.findByIdAndUpdate as any).mockResolvedValue(updatedExam)

      // Act
      const result = await repository.reorderQuestions(examId, questionIds)

      // Assert
      expect(Exam.findByIdAndUpdate).toHaveBeenCalledWith(
        examId,
        { questions: questionIds.map(id => new Types.ObjectId(id)) },
        { new: true }
      )
      expect(result).toBe(updatedExam)
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
        status: { $in: ['in-progress', 'submitted'] },
      })
      expect(result).toBe(true)
    })

    it('should return false when exam has no active attempts', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439011'
      const { ExamAttempt } = await import('../../../src/shared/model/exam-attempt.model')

      ;(ExamAttempt.countDocuments as any).mockResolvedValue(0)

      // Act
      const result = await repository.hasActiveAttempts(examId)

      // Assert
      expect(result).toBe(false)
    })
  })
})

