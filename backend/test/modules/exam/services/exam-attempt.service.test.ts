import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamAttemptService } from '../../../../src/modules/exam/services/exam-attempt.service'
import {
  IExamRepository,
  IQuestionRepository,
  IExamParticipantRepository,
  IExamAttemptRepository,
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

const mockParticipantRepository: IExamParticipantRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByExamId: vi.fn(),
  findByUserId: vi.fn(),
  findByAccessCode: vi.fn(),
  findByExamAndUser: vi.fn(),
  markAsUsed: vi.fn(),
  deleteById: vi.fn(),
  hasStartedAttempt: vi.fn(),
}

const mockAttemptRepository: IExamAttemptRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByExamAndUser: vi.fn(),
  findByParticipant: vi.fn(),
  updateById: vi.fn(),
  updateAnswer: vi.fn(),
  markAsAbandoned: vi.fn(),
  updateActivity: vi.fn(),
  findByUserId: vi.fn(),
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
    create: vi.fn(),
  },
}))

// Mock pagination utilities
vi.mock('../../../../src/shared/util/pagination', () => ({
  paginateArray: vi.fn((data, pagination) => ({
    data: data.slice(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit
    ),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: data.length,
      totalPages: Math.ceil(data.length / pagination.limit),
      hasNext: pagination.page * pagination.limit < data.length,
      hasPrev: pagination.page > 1,
    },
  })),
}))

describe('ExamAttemptService', () => {
  let attemptService: ExamAttemptService
  const userId = '507f1f77bcf86cd799439011'
  const examId = '507f1f77bcf86cd799439012'
  const participantId = '507f1f77bcf86cd799439014'
  const attemptId = '507f1f77bcf86cd799439015'

  beforeEach(() => {
    vi.clearAllMocks()
    attemptService = new ExamAttemptService(
      mockExamRepository,
      mockQuestionRepository,
      mockParticipantRepository,
      mockAttemptRepository
    )
  })

  describe('startExam', () => {
    it('should start exam successfully', async () => {
      // Arrange
      const input: any = {
        accessCode: 'ABC123',
      }

      const mockParticipant = {
        _id: new Types.ObjectId(participantId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
        isUsed: false,
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
      }

      const mockQuestions = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: '4',
          points: 1,
        },
      ]

      const mockAttempt = {
        _id: new Types.ObjectId(attemptId),
        examId: new Types.ObjectId(examId),
        participantId: new Types.ObjectId(participantId),
        userId: new Types.ObjectId(userId),
        questionOrder: [0],
        status: 'in-progress',
        startedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      }

      ;(mockParticipantRepository.findByAccessCode as any).mockResolvedValue(
        mockParticipant
      )
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockQuestions
      )
      ;(mockParticipantRepository.markAsUsed as any).mockResolvedValue(true)
      ;(mockAttemptRepository.create as any).mockResolvedValue(mockAttempt)
      ;(mockAttemptRepository.updateById as any).mockResolvedValue(mockAttempt)

      // Act
      const result = await attemptService.startExam(input, userId)

      // Assert
      expect(mockParticipantRepository.findByAccessCode).toHaveBeenCalledWith(
        'ABC123'
      )
      expect(mockParticipantRepository.markAsUsed).toHaveBeenCalled()
      expect(result.attemptId).toBe(attemptId)
      expect(result.examId).toBe(examId)
    })
  })

  describe('getNextQuestion', () => {
    it('should get next question successfully', async () => {
      // Arrange
      const input: any = { attemptId }

      const mockAttempt = {
        _id: new Types.ObjectId(attemptId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
        status: 'in-progress',
        questionOrder: [0],
        answeredQuestions: [],
        currentQuestionIndex: 0,
        startedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        duration: 60,
      }

      const mockQuestions = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          points: 1,
        },
      ]

      const mockQuestionHandler = {
        render: vi.fn().mockReturnValue({
          id: mockQuestions[0]._id.toString(),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          points: 1,
        }),
      }

      ;(mockAttemptRepository.findById as any).mockResolvedValue(mockAttempt)
      ;(mockAttemptRepository.updateActivity as any).mockResolvedValue(true)
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockQuestions
      )
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)

      // Act
      const result = await attemptService.getNextQuestion(input, userId)

      // Assert
      expect(mockAttemptRepository.findById).toHaveBeenCalledWith(attemptId)
      expect(result.question).toBeDefined()
      expect(result.progress).toBeDefined()
      expect(result.timeRemaining).toBeDefined()
    })
  })

  describe('submitAnswer', () => {
    it('should submit answer successfully', async () => {
      // Arrange
      const questionId = '507f1f77bcf86cd799439016'
      const input: any = {
        attemptId,
        questionId,
        answer: '4',
      }

      const mockAttempt = {
        _id: new Types.ObjectId(attemptId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
        status: 'in-progress',
        startedAt: new Date(),
        answeredQuestions: [],
      }

      const mockUpdatedAttempt = {
        ...mockAttempt,
        answeredQuestions: [0],
      }

      const mockQuestion = {
        _id: new Types.ObjectId(questionId),
        examId: new Types.ObjectId(examId),
        type: 'multiple-choice',
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        points: 1,
      }

      const mockQuestions = [mockQuestion]

      const mockQuestionHandler = {
        validateAnswerFormat: vi.fn().mockReturnValue(true),
      }

      ;(mockAttemptRepository.findById as any)
        .mockResolvedValueOnce(mockAttempt)
        .mockResolvedValueOnce(mockUpdatedAttempt)
      ;(mockQuestionRepository.findById as any).mockResolvedValue(mockQuestion)
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)
      ;(mockAttemptRepository.updateAnswer as any).mockResolvedValue(true)
      ;(mockAttemptRepository.updateActivity as any).mockResolvedValue(true)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockQuestions
      )

      // Act
      const result = await attemptService.submitAnswer(input, userId)

      // Assert
      expect(mockAttemptRepository.findById).toHaveBeenCalledWith(attemptId)
      expect(mockQuestionRepository.findById).toHaveBeenCalledWith(questionId)
      expect(mockAttemptRepository.updateAnswer).toHaveBeenCalled()
      expect(result.message).toBe('Answer saved successfully')
    })
  })

  describe('submitExam', () => {
    it('should submit exam successfully', async () => {
      // Arrange
      const input: any = { attemptId }

      const mockAttempt = {
        _id: new Types.ObjectId(attemptId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
        status: 'in-progress',
        startedAt: new Date(),
        answeredQuestions: [0],
        answers: new Map([
          [
            '507f1f77bcf86cd799439016',
            { answer: '4', timestamp: new Date() },
          ],
        ]),
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        duration: 60,
      }

      const mockQuestions = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: '4',
          points: 1,
        },
      ]

      const mockUpdatedAttempt = {
        ...mockAttempt,
        status: 'submitted',
        score: 1,
        maxScore: 1,
        percentage: 100,
        submittedAt: new Date(),
      }

      const mockQuestionHandler = {
        markAnswer: vi.fn().mockReturnValue(1),
      }

      ;(mockAttemptRepository.findById as any).mockResolvedValue(mockAttempt)
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockQuestions
      )
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)
      ;(mockAttemptRepository.updateById as any).mockResolvedValue(
        mockUpdatedAttempt
      )

      // Act
      const result = await attemptService.submitExam(input, userId)

      // Assert
      expect(mockAttemptRepository.findById).toHaveBeenCalledWith(attemptId)
      expect(mockAttemptRepository.updateById).toHaveBeenCalled()
      expect(result.attemptId).toBe(attemptId)
      expect(result.score).toBe(1)
      expect(result.maxScore).toBe(1)
    })
  })

  describe('getAttemptResults', () => {
    it('should get attempt results successfully', async () => {
      // Arrange
      const input: any = { attemptId }

      const mockAttempt = {
        _id: new Types.ObjectId(attemptId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
        status: 'submitted',
        score: 1,
        maxScore: 1,
        percentage: 100,
        submittedAt: new Date(),
        answers: new Map([
          [
            '507f1f77bcf86cd799439016',
            { answer: '4', timestamp: new Date() },
          ],
        ]),
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        title: 'Test Exam',
      }

      const mockQuestions = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: '4',
          points: 1,
        },
      ]

      const mockQuestionHandler = {
        markAnswer: vi.fn().mockReturnValue(1),
      }

      ;(mockAttemptRepository.findById as any).mockResolvedValue(mockAttempt)
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockQuestions
      )
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)

      // Act
      const result = await attemptService.getAttemptResults(input, userId)

      // Assert
      expect(mockAttemptRepository.findById).toHaveBeenCalledWith(attemptId)
      expect(result.attemptId).toBe(attemptId)
      expect(result.score).toBe(1)
      expect(result.answers).toBeDefined()
    })
  })

  describe('getMyResults', () => {
    it('should get my results successfully', async () => {
      // Arrange
      const input: any = {
        pagination: { page: 1, limit: 10 },
      }

      const mockAttempts = [
        {
          _id: new Types.ObjectId(attemptId),
          examId: new Types.ObjectId(examId),
          userId: new Types.ObjectId(userId),
          status: 'submitted',
          score: 1,
          maxScore: 1,
          percentage: 100,
          submittedAt: new Date(),
        },
      ]

      const mockExam = {
        _id: new Types.ObjectId(examId),
        title: 'Test Exam',
      }

      ;(mockAttemptRepository.findByUserId as any).mockResolvedValue(
        mockAttempts
      )
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)

      // Act
      const result = await attemptService.getMyResults(input, userId)

      // Assert
      expect(mockAttemptRepository.findByUserId).toHaveBeenCalledWith(userId)
      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })
})

