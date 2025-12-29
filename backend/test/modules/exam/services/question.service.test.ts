import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuestionService } from '../../../../src/modules/exam/services/question.service'
import {
  IExamRepository,
  IQuestionRepository,
} from '../../../../src/shared/repository'
import { IExamCacheService } from '../../../../src/modules/exam/cache'
import { Types } from 'mongoose'
import { QuestionFactory } from '../../../../src/modules/exam/factory/question.factory'
import { TransactionManager, Sanitizer } from '../../../../src/shared/util'

// Mock repositories
const mockExamRepository: IExamRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByIdForExaminer: vi.fn(),
  findByIdForParticipant: vi.fn(),
  findByIdWithCorrectAnswers: vi.fn(),
  findByCreatorId: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn(),
  addQuestion: vi.fn(),
  removeQuestion: vi.fn(),
  reorderQuestions: vi.fn(),
  hasActiveAttempts: vi.fn(),
  getQuestionCount: vi.fn(),
  getParticipantCount: vi.fn(),
}

const mockQuestionRepository: IQuestionRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByExamId: vi.fn(),
  findByExamIdWithCorrectAnswers: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn(),
  updateOrder: vi.fn(),
}

const mockExamCache: IExamCacheService = {
  getExamList: vi.fn(),
  setExamList: vi.fn(),
  invalidateExamList: vi.fn(),
  getExamDetail: vi.fn(),
  setExamDetail: vi.fn(),
  invalidateExam: vi.fn(),
  getExamByCode: vi.fn(),
  setExamByCode: vi.fn(),
  invalidateExamByCode: vi.fn(),
  getExamResults: vi.fn(),
  setExamResults: vi.fn(),
  invalidateExamResults: vi.fn(),
  wrapExamList: vi.fn(),
  wrapExamDetail: vi.fn(),
  wrapExamByCode: vi.fn(),
  wrapExamResults: vi.fn(),
}

// Mock logger
vi.mock('../../../../src/shared/util/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock TransactionManager
vi.mock('../../../../src/shared/util/transaction.manager', () => ({
  TransactionManager: {
    withTransaction: vi.fn(callback => callback('mock-session')),
  },
}))

// Mock QuestionFactory
vi.mock('../../../../src/modules/exam/factory/question.factory', () => ({
  QuestionFactory: {
    createQuestion: vi.fn(),
    create: vi.fn(),
  },
}))

// Mock Sanitizer
vi.mock('../../../../src/shared/util/sanitizer', () => ({
  Sanitizer: {
    sanitize: vi.fn(val => val),
    sanitizeObject: vi.fn(val => val),
  },
}))

describe('QuestionService', () => {
  let questionService: QuestionService
  const userId = '507f1f77bcf86cd799439011'
  const examId = '507f1f77bcf86cd799439012'

  beforeEach(() => {
    vi.clearAllMocks()
    questionService = new QuestionService(
      mockExamRepository,
      mockQuestionRepository,
      mockExamCache
    )
  })

  describe('addQuestion', () => {
    it('should add question to exam successfully and invalidate cache', async () => {
      // Arrange
      const input: any = {
        examId,
        type: 'multiple-choice',
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        points: 1,
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
      }

      const mockQuestion = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
        examId: new Types.ObjectId(examId),
        type: 'multiple-choice',
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        points: 1,
        order: 0,
        version: 1,
      }

      const mockQuestionHandler = {
        render: vi.fn().mockReturnValue({
          id: mockQuestion._id.toString(),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          points: 1,
        }),
      }

      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockExamRepository.hasActiveAttempts).mockResolvedValue(false)
      vi.mocked(mockQuestionRepository.findByExamId).mockResolvedValue([])
      vi.mocked(QuestionFactory.createQuestion).mockReturnValue({
        ...input,
        order: 0,
      })
      vi.mocked(mockQuestionRepository.create).mockResolvedValue(mockQuestion as any)
      vi.mocked(QuestionFactory.create).mockReturnValue(mockQuestionHandler as any)

      // Act
      const result = await questionService.addQuestion(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(TransactionManager.withTransaction).toHaveBeenCalled()
      expect(mockQuestionRepository.create).toHaveBeenCalled()
      expect(mockExamRepository.addQuestion).toHaveBeenCalled()
      expect(mockExamCache.invalidateExam).toHaveBeenCalledWith(examId)
      expect(result.id).toBe(mockQuestion._id.toString())
    })
  })

  describe('updateQuestion', () => {
    it('should update question successfully and invalidate cache', async () => {
      // Arrange
      const questionId = '507f1f77bcf86cd799439013'
      const input: any = {
        examId,
        questionId,
        question: 'Updated question',
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
      }

      const mockQuestion = {
        _id: new Types.ObjectId(questionId),
        examId: new Types.ObjectId(examId),
        type: 'multiple-choice',
        question: 'Old question',
        version: 1,
      }

      const mockUpdatedQuestion = {
        ...mockQuestion,
        question: 'Updated question',
        version: 2,
      }

      const mockQuestionHandler = {
        render: vi.fn().mockReturnValue({
          id: questionId,
          question: 'Updated question',
        }),
      }

      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockQuestionRepository.findById).mockResolvedValue(mockQuestion as any)
      vi.mocked(mockExamRepository.hasActiveAttempts).mockResolvedValue(false)
      vi.mocked(QuestionFactory.createQuestion).mockReturnValue(mockUpdatedQuestion as any)
      vi.mocked(mockQuestionRepository.updateById).mockResolvedValue(mockUpdatedQuestion as any)
      vi.mocked(QuestionFactory.create).mockReturnValue(mockQuestionHandler as any)

      // Act
      const result = await questionService.updateQuestion(input, userId)

      // Assert
      expect(mockQuestionRepository.updateById).toHaveBeenCalled()
      expect(mockExamCache.invalidateExam).toHaveBeenCalledWith(examId)
      expect(result.id).toBe(questionId)
    })
  })

  describe('deleteQuestion', () => {
    it('should delete question successfully and invalidate cache', async () => {
      // Arrange
      const questionId = '507f1f77bcf86cd799439013'
      const input: any = {
        examId,
        questionId,
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
      }

      const mockQuestion = {
        _id: new Types.ObjectId(questionId),
        examId: new Types.ObjectId(examId),
      }

      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockQuestionRepository.findById).mockResolvedValue(mockQuestion as any)
      vi.mocked(mockExamRepository.hasActiveAttempts).mockResolvedValue(false)

      // Act
      const result = await questionService.deleteQuestion(input, userId)

      // Assert
      expect(TransactionManager.withTransaction).toHaveBeenCalled()
      expect(mockExamRepository.removeQuestion).toHaveBeenCalled()
      expect(mockQuestionRepository.deleteById).toHaveBeenCalled()
      expect(mockExamCache.invalidateExam).toHaveBeenCalledWith(examId)
      expect(result.message).toBe('Question deleted successfully')
    })
  })
})
