import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuestionService } from '../../../../src/modules/exam/services/question.service'
import {
  IExamRepository,
  IQuestionRepository,
} from '../../../../src/shared/repository'
import { Types } from 'mongoose'
import { QuestionFactory } from '../../../../src/modules/exam/factory/question.factory'

// Mock repositories
const mockExamRepository: IExamRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByCreatorId: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn(),
  addQuestion: vi.fn(),
  removeQuestion: vi.fn(),
  reorderQuestions: vi.fn(),
  hasActiveAttempts: vi.fn(),
}

const mockQuestionRepository: IQuestionRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByExamId: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn(),
  updateOrder: vi.fn(),
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

// Mock QuestionFactory
vi.mock('../../../../src/modules/exam/factory/question.factory', () => ({
  QuestionFactory: {
    createQuestion: vi.fn(),
    create: vi.fn(),
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
      mockQuestionRepository
    )
  })

  describe('addQuestion', () => {
    it('should add question to exam successfully', async () => {
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

      const mockExistingQuestions: any[] = []
      const mockStructuredQuestion = {
        type: 'multiple-choice',
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        points: 1,
        order: 0,
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

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockExamRepository.hasActiveAttempts as any).mockResolvedValue(false)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockExistingQuestions
      )
      ;(QuestionFactory.createQuestion as any).mockReturnValue(
        mockStructuredQuestion
      )
      ;(mockQuestionRepository.create as any).mockResolvedValue(mockQuestion)
      ;(mockExamRepository.addQuestion as any).mockResolvedValue(mockExam)
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)

      // Act
      const result = await questionService.addQuestion(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(mockExamRepository.hasActiveAttempts).toHaveBeenCalledWith(examId)
      expect(mockQuestionRepository.create).toHaveBeenCalled()
      expect(result.id).toBe(mockQuestion._id.toString())
      expect(result.type).toBe('multiple-choice')
    })
  })

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
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
        title: 'Test Exam',
      }

      const mockQuestion = {
        _id: new Types.ObjectId(questionId),
        examId: new Types.ObjectId(examId),
        type: 'multiple-choice',
        question: 'Updated question',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        points: 1,
        order: 0,
      }

      const mockUpdatedQuestion = {
        ...mockQuestion,
        question: 'Updated question',
      }

      const mockQuestionHandler = {
        render: vi.fn().mockReturnValue({
          id: questionId,
          type: 'multiple-choice',
          question: 'Updated question',
          options: ['3', '4', '5'],
          points: 1,
        }),
      }

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findById as any).mockResolvedValue(mockQuestion)
      ;(mockExamRepository.hasActiveAttempts as any).mockResolvedValue(false)
      ;(mockQuestionRepository.updateById as any).mockResolvedValue(
        mockUpdatedQuestion
      )
      ;(QuestionFactory.createQuestion as any).mockReturnValue({
        question: 'Updated question',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        points: 1,
      })
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)

      // Act
      const result = await questionService.updateQuestion(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(mockQuestionRepository.findById).toHaveBeenCalledWith(questionId)
      expect(mockQuestionRepository.updateById).toHaveBeenCalled()
      expect(result.id).toBe(questionId)
      expect(result.question).toBe('Updated question')
    })
  })

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      // Arrange
      const questionId = '507f1f77bcf86cd799439013'
      const input: any = {
        examId,
        questionId,
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
      }

      const mockQuestion = {
        _id: new Types.ObjectId(questionId),
        examId: new Types.ObjectId(examId),
        type: 'multiple-choice',
        question: 'What is 2+2?',
      }

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findById as any).mockResolvedValue(mockQuestion)
      ;(mockExamRepository.hasActiveAttempts as any).mockResolvedValue(false)
      ;(mockQuestionRepository.deleteById as any).mockResolvedValue(true)
      ;(mockExamRepository.removeQuestion as any).mockResolvedValue(mockExam)

      // Act
      const result = await questionService.deleteQuestion(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(mockQuestionRepository.findById).toHaveBeenCalledWith(questionId)
      expect(mockQuestionRepository.deleteById).toHaveBeenCalledWith(questionId)
      expect(mockExamRepository.removeQuestion).toHaveBeenCalledWith(
        examId,
        questionId
      )
      expect(result.message).toBe('Question deleted successfully')
    })
  })
})

