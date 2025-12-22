import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamService } from '../../../../src/modules/exam/services/exam.service'
import {
  IExamRepository,
  IQuestionRepository,
  IExamParticipantRepository,
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

// Mock paginateArray
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

describe('ExamService', () => {
  let examService: ExamService
  const userId = '507f1f77bcf86cd799439011'

  beforeEach(() => {
    vi.clearAllMocks()
    examService = new ExamService(
      mockExamRepository,
      mockQuestionRepository,
      mockParticipantRepository
    )
  })

  describe('createExam', () => {
    it('should create a new exam successfully', async () => {
      // Arrange
      const input: any = {
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
        randomizeQuestions: false,
        showResultsImmediately: false,
      }

      const mockExam = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
        randomizeQuestions: false,
        showResultsImmediately: false,
        createdAt: new Date(),
      }

      ;(mockExamRepository.create as any).mockResolvedValue(mockExam)

      // Act
      const result = await examService.createExam(input, userId)

      // Assert
      expect(mockExamRepository.create).toHaveBeenCalledWith({
        ...input,
        creatorId: userId,
        startDate: undefined,
        endDate: undefined,
      })
      expect(result.id).toBe(mockExam._id.toString())
      expect(result.title).toBe('Test Exam')
      expect(result.duration).toBe(60)
    })
  })

  describe('listExams', () => {
    it('should list exams successfully', async () => {
      // Arrange
      const input: any = {
        pagination: { page: 1, limit: 10 },
      }

      const mockExams = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          title: 'Exam 1',
          description: 'Description 1',
          duration: 60,
          createdAt: new Date(),
        },
      ]

      const mockQuestions = []
      const mockParticipants = []

      ;(mockExamRepository.findByCreatorId as any).mockResolvedValue(mockExams)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(mockQuestions)
      ;(mockParticipantRepository.findByExamId as any).mockResolvedValue(
        mockParticipants
      )

      // Act
      const result = await examService.listExams(input, userId)

      // Assert
      expect(mockExamRepository.findByCreatorId).toHaveBeenCalledWith(userId, {
        search: undefined,
        isActive: undefined,
      })
      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })

  describe('getExam', () => {
    it('should get exam details successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const input: any = { examId }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
        randomizeQuestions: false,
        showResultsImmediately: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockQuestions = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          points: 1,
          order: 1,
        },
      ]

      const mockParticipants = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
          email: 'participant@example.com',
          accessCode: 'ABC123',
          isUsed: false,
          addedAt: new Date(),
        },
      ]

      const mockQuestionHandler = {
        render: vi.fn().mockReturnValue({
          id: mockQuestions[0]._id.toString(),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          points: 1,
          order: 1,
        }),
      }

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(mockQuestions)
      ;(mockParticipantRepository.findByExamId as any).mockResolvedValue(
        mockParticipants
      )
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)

      // Act
      const result = await examService.getExam(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(result.id).toBe(examId)
      expect(result.title).toBe('Test Exam')
      expect(result.questions).toBeDefined()
      expect(result.participants).toBeDefined()
    })
  })

  describe('updateExam', () => {
    it('should update exam successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const input: any = {
        examId,
        title: 'Updated Exam',
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Updated Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
        randomizeQuestions: false,
        showResultsImmediately: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockExamRepository.updateById as any).mockResolvedValue(mockExam)

      // Act
      const result = await examService.updateExam(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(mockExamRepository.updateById).toHaveBeenCalled()
      expect(result.id).toBe(examId)
      expect(result.title).toBe('Updated Exam')
    })
  })

  describe('deleteExam', () => {
    it('should delete exam successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const input: any = { examId }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
      }

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockExamRepository.deleteById as any).mockResolvedValue(true)

      // Act
      const result = await examService.deleteExam(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(mockExamRepository.deleteById).toHaveBeenCalledWith(examId)
      expect(result.message).toBe('Exam deleted successfully')
    })
  })

  describe('getExamResults', () => {
    it('should get exam results successfully', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const input: any = {
        examId,
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
      }

      const mockAttempts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
          userId: { email: 'participant@example.com' },
          score: 80,
          maxScore: 100,
          percentage: 80,
          submittedAt: new Date(),
          status: 'submitted',
        },
      ]

      // Mock ExamAttempt model
      const mockExamAttemptModel = {
        find: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue(mockAttempts),
          }),
        }),
      }

      vi.doMock('../../../../src/shared/model/exam-attempt.model', () => ({
        ExamAttempt: mockExamAttemptModel,
      }))

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)

      // Act
      const result = await examService.getExamResults(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getExamByCode', () => {
    it('should get exam by access code successfully', async () => {
      // Arrange
      const accessCode = 'ABC123'
      const input: any = { accessCode }

      const mockParticipant = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
        examId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        userId: new Types.ObjectId(userId),
        email: 'participant@example.com',
        accessCode: 'ABC123',
        isUsed: false,
      }

      const mockExam = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
        randomizeQuestions: false,
        showResultsImmediately: false,
        createdAt: new Date(),
      }

      const mockQuestions = []

      ;(mockParticipantRepository.findByAccessCode as any).mockResolvedValue(
        mockParticipant
      )
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(mockQuestions)

      // Act
      const result = await examService.getExamByCode(input, userId)

      // Assert
      expect(mockParticipantRepository.findByAccessCode).toHaveBeenCalledWith(
        accessCode
      )
      expect(mockExamRepository.findById).toHaveBeenCalled()
      expect(result.id).toBe(mockExam._id.toString())
      expect(result.title).toBe('Test Exam')
    })
  })
})

