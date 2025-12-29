import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuestionRepository } from '../../../src/shared/repository/question.repository'
import { Question } from '../../../src/shared/model/question.model'
import { Types } from 'mongoose'

// Mock the Question model
vi.mock('../../../src/shared/model/question.model', async () => {
  const { vi } = await import('vitest')
  const { Types } = await import('mongoose')

  const mockQuery = {
    sort: vi.fn().mockReturnThis(),
    session: vi.fn().mockReturnThis(),
    exec: vi.fn(),
    then: vi.fn().mockImplementation(function(callback) {
      return Promise.resolve(this.exec()).then(callback);
    }),
  }

  class MockQuestion {
    _id: any
    examId: any
    type: string
    question: string
    options: string[]
    correctAnswer: string
    points: number
    order: number
    save: any

    constructor(data: any) {
      this._id = data?._id || new Types.ObjectId('507f1f77bcf86cd799439011')
      this.examId = data?.examId || new Types.ObjectId('507f1f77bcf86cd799439012')
      this.type = data?.type || 'multi-choice'
      this.question = data?.question || 'What is 2+2?'
      this.options = data?.options || ['3', '4', '5', '6']
      this.correctAnswer = data?.correctAnswer || '4'
      this.points = data?.points ?? 1
      this.order = data?.order || 1
      this.save = vi.fn().mockResolvedValue(true)
      Object.assign(this, data)
    }
  }

  MockQuestion.findById = vi.fn().mockReturnValue(mockQuery)
  MockQuestion.find = vi.fn().mockReturnValue(mockQuery)
  MockQuestion.findByIdAndUpdate = vi.fn()
  MockQuestion.findByIdAndDelete = vi.fn()
  MockQuestion.bulkWrite = vi.fn()

  return {
    Question: MockQuestion,
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

describe('QuestionRepository', () => {
  let repository: QuestionRepository
  let mockQuery: any
  let mockQuestionInstance: any

  beforeEach(() => {
    repository = new QuestionRepository()
    vi.clearAllMocks()
    
    mockQuery = {
      sort: vi.fn().mockReturnThis(),
      session: vi.fn().mockReturnThis(),
      exec: vi.fn(),
      then: vi.fn().mockImplementation(function(callback) {
        return Promise.resolve(this.exec()).then(callback);
      }),
    }
    
    mockQuestionInstance = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      examId: new Types.ObjectId('507f1f77bcf86cd799439012'),
      type: 'multi-choice',
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      points: 1,
      order: 1,
      save: vi.fn().mockResolvedValue(true),
    }
    
    ;(Question.findById as any).mockReturnValue(mockQuery)
    ;(Question.find as any).mockReturnValue(mockQuery)
    mockQuery.sort.mockReturnThis()
    mockQuery.session.mockReturnThis()
    mockQuery.exec.mockResolvedValue(null)
  })

  describe('create', () => {
    it('should use default points value when not provided', async () => {
      // Arrange
      const questionData = {
        examId: '507f1f77bcf86cd799439012',
        type: 'multi-choice',
        question: 'What is 2+2?',
        correctAnswer: '4',
        order: 1,
      }

      const mockSavedQuestion = new Question(questionData)
      const saveMock = vi.fn().mockResolvedValue(true)
      mockSavedQuestion.save = saveMock

      // Act
      const result = await repository.create(questionData)

      // Assert
      expect(result).toBeInstanceOf(Question)
      expect(result.points).toBe(1) // Default value
    })
  })

  describe('findById', () => {
    it('should find question by ID successfully', async () => {
      // Arrange
      const questionId = '507f1f77bcf86cd799439011'
      mockQuery.exec.mockResolvedValue(mockQuestionInstance)

      // Act
      const result = await repository.findById(questionId)

      // Assert
      expect(Question.findById).toHaveBeenCalledWith(questionId)
      expect(result).toBe(mockQuestionInstance)
    })
  })


  describe('updateById', () => {
    it('should update question successfully', async () => {
      // Arrange
      const questionId = '507f1f77bcf86cd799439011'
      const updateData = { question: 'Updated question' }
      const updatedQuestion = { ...mockQuestionInstance, ...updateData }

      ;(Question.findByIdAndUpdate as any).mockResolvedValue(updatedQuestion)

      // Act
      const result = await repository.updateById(questionId, updateData)

      // Assert
      expect(Question.findByIdAndUpdate).toHaveBeenCalledWith(questionId, updateData, {
        new: true,
        runValidators: true,
      })
      expect(result).toBe(updatedQuestion)
    })
  })

  describe('deleteById', () => {
    it('should delete question successfully', async () => {
      // Arrange
      const questionId = '507f1f77bcf86cd799439011'

      ;(Question.findByIdAndDelete as any).mockResolvedValue(mockQuestionInstance)

      // Act
      const result = await repository.deleteById(questionId)

      // Assert
      expect(Question.findByIdAndDelete).toHaveBeenCalledWith(questionId, {})
      expect(result).toBe(true)
    })
  })

  describe('updateOrder', () => {
    it('should update question orders successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const questionOrders = [
        { id: '507f1f77bcf86cd799439011', order: 1 },
        { id: '507f1f77bcf86cd799439013', order: 2 },
      ]

      ;(Question.bulkWrite as any).mockResolvedValue({})

      // Act
      await repository.updateOrder(examId, questionOrders)

      // Assert
      expect(Question.bulkWrite).toHaveBeenCalled()
    })
  })
})
