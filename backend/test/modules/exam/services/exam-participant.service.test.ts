import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamParticipantService } from '../../../../src/modules/exam/services/exam-participant.service'
import {
  IExamRepository,
  IExamParticipantRepository,
  IExamAttemptRepository,
  IQuestionRepository,
  IUserRepository,
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

const mockQuestionRepository: IQuestionRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByExamId: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn(),
  updateOrder: vi.fn(),
}

const mockUserRepository: IUserRepository = {
  findByEmail: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  updateById: vi.fn(),
  updateRefreshToken: vi.fn(),
  deleteById: vi.fn(),
  findOne: vi.fn(),
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
  createPaginationMetadata: vi.fn((total, pagination) => ({
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
    hasNext: pagination.page * pagination.limit < total,
    hasPrev: pagination.page > 1,
  })),
}))

describe('ExamParticipantService', () => {
  let participantService: ExamParticipantService
  const userId = '507f1f77bcf86cd799439011'
  const examId = '507f1f77bcf86cd799439012'

  beforeEach(() => {
    vi.clearAllMocks()
    participantService = new ExamParticipantService(
      mockExamRepository,
      mockParticipantRepository,
      mockAttemptRepository,
      mockQuestionRepository,
      mockUserRepository
    )
  })

  describe('addParticipant', () => {
    it('should add participant to exam successfully', async () => {
      // Arrange
      const input: any = {
        examId,
        email: 'participant@example.com',
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
        availableAnytime: true,
      }

      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
        email: 'participant@example.com',
      }

      const mockParticipant = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
        examId: new Types.ObjectId(examId),
        userId: mockUser._id,
        email: 'participant@example.com',
        accessCode: 'ABC123',
        addedAt: new Date(),
      }

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockUserRepository.findByEmail as any).mockResolvedValue(mockUser)
      ;(mockParticipantRepository.findByExamAndUser as any).mockResolvedValue(
        null
      )
      ;(mockParticipantRepository.create as any).mockResolvedValue(
        mockParticipant
      )

      // Act
      const result = await participantService.addParticipant(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'participant@example.com'
      )
      expect(result.id).toBe(mockParticipant._id.toString())
      expect(result.email).toBe('participant@example.com')
      expect(result.accessCode).toBe('ABC123')
    })
  })

  describe('removeParticipant', () => {
    it('should remove participant from exam successfully', async () => {
      // Arrange
      const participantId = '507f1f77bcf86cd799439014'
      const input: any = { participantId }

      const mockParticipant = {
        _id: new Types.ObjectId(participantId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
      }

      ;(mockParticipantRepository.findById as any).mockResolvedValue(
        mockParticipant
      )
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockParticipantRepository.hasStartedAttempt as any).mockResolvedValue(
        false
      )
      ;(mockParticipantRepository.deleteById as any).mockResolvedValue(true)

      // Act
      const result = await participantService.removeParticipant(input, userId)

      // Assert
      expect(mockParticipantRepository.findById).toHaveBeenCalledWith(
        participantId
      )
      expect(mockParticipantRepository.deleteById).toHaveBeenCalledWith(
        participantId
      )
      expect(result.message).toBe('Participant removed successfully')
    })
  })

  describe('listParticipants', () => {
    it('should list participants successfully', async () => {
      // Arrange
      const input: any = {
        examId,
        pagination: { page: 1, limit: 10 },
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
      }

      const mockParticipants = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
          examId: new Types.ObjectId(examId),
          email: 'participant@example.com',
          accessCode: 'ABC123',
          isUsed: false,
          addedAt: new Date(),
        },
      ]

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockParticipantRepository.findByExamId as any).mockResolvedValue(
        mockParticipants
      )
      ;(mockAttemptRepository.findByParticipant as any).mockResolvedValue(null)

      // Act
      const result = await participantService.listParticipants(input, userId)

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })

  describe('getParticipantResult', () => {
    it('should get participant result successfully', async () => {
      // Arrange
      const participantId = '507f1f77bcf86cd799439014'
      const input: any = {
        examId,
        participantId,
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
      }

      const mockParticipant = {
        _id: new Types.ObjectId(participantId),
        examId: new Types.ObjectId(examId),
        email: 'participant@example.com',
        accessCode: 'ABC123',
        addedAt: new Date(),
      }

      const mockQuestions = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: '4',
          points: 1,
        },
      ]

      const mockAttempt = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
        status: 'submitted',
        score: 1,
        maxScore: 1,
        percentage: 100,
        startedAt: new Date(),
        submittedAt: new Date(),
        answers: new Map([
          [
            mockQuestions[0]._id.toString(),
            { answer: '4', timestamp: new Date() },
          ],
        ]),
      }

      const mockQuestionHandler = {
        markAnswer: vi.fn().mockReturnValue(1),
      }

      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockParticipantRepository.findById as any).mockResolvedValue(
        mockParticipant
      )
      ;(mockAttemptRepository.findByParticipant as any).mockResolvedValue(
        mockAttempt
      )
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockQuestions
      )
      ;(QuestionFactory.create as any).mockReturnValue(mockQuestionHandler)

      // Act
      const result = await participantService.getParticipantResult(
        input,
        userId
      )

      // Assert
      expect(mockExamRepository.findById).toHaveBeenCalledWith(examId)
      expect(result.data).toBeDefined()
      expect(result.data.participant).toBeDefined()
      expect(result.attempt).toBeDefined()
    })
  })

  describe('getMyExams', () => {
    it('should get participant exams successfully', async () => {
      // Arrange
      const input: any = {
        pagination: { page: 1, limit: 10 },
      }

      const mockParticipants = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
          examId: new Types.ObjectId(examId),
          userId: new Types.ObjectId(userId),
          email: 'participant@example.com',
          accessCode: 'ABC123',
          addedAt: new Date(),
        },
      ]

      const mockExam = {
        _id: new Types.ObjectId(examId),
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
      }

      const mockQuestions: any[] = []

      ;(mockParticipantRepository.findByUserId as any).mockResolvedValue(
        mockParticipants
      )
      ;(mockExamRepository.findById as any).mockResolvedValue(mockExam)
      ;(mockAttemptRepository.findByParticipant as any).mockResolvedValue(null)
      ;(mockQuestionRepository.findByExamId as any).mockResolvedValue(
        mockQuestions
      )

      // Act
      const result = await participantService.getMyExams(input, userId)

      // Assert
      expect(mockParticipantRepository.findByUserId).toHaveBeenCalledWith(
        userId
      )
      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })
})

