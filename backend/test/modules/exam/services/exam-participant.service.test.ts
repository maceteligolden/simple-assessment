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
import { IParticipantCacheService } from '../../../../src/modules/exam/cache'
import { Types } from 'mongoose'
import { QuestionFactory } from '../../../../src/modules/exam/factory/question.factory'

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
  findByExamIdWithCorrectAnswers: vi.fn(),
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

const mockParticipantCache: IParticipantCacheService = {
  getMyExams: vi.fn(),
  setMyExams: vi.fn(),
  invalidateMyExams: vi.fn(),
  getParticipants: vi.fn(),
  setParticipants: vi.fn(),
  invalidateParticipants: vi.fn(),
  getParticipantResult: vi.fn(),
  setParticipantResult: vi.fn(),
  invalidateParticipantResult: vi.fn(),
  getNotStartedExams: vi.fn(),
  setNotStartedExams: vi.fn(),
  invalidateNotStartedExams: vi.fn(),
  wrapMyExams: vi.fn(),
  wrapParticipants: vi.fn(),
  wrapParticipantResult: vi.fn(),
  wrapNotStartedExams: vi.fn(),
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
      mockUserRepository,
      mockParticipantCache
    )
  })

  describe('addParticipant', () => {
    it('should add participant to exam successfully and invalidate cache', async () => {
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

      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser as any)
      vi.mocked(mockParticipantRepository.findByExamAndUser).mockResolvedValue(null)
      vi.mocked(mockParticipantRepository.create).mockResolvedValue(mockParticipant as any)

      // Act
      const result = await participantService.addParticipant(input, userId)

      // Assert
      expect(mockParticipantRepository.create).toHaveBeenCalled()
      expect(mockParticipantCache.invalidateParticipants).toHaveBeenCalledWith(examId)
      expect(mockParticipantCache.invalidateMyExams).toHaveBeenCalled()
      expect(result.id).toBe(mockParticipant._id.toString())
    })
  })

  describe('removeParticipant', () => {
    it('should remove participant and invalidate cache', async () => {
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
      }

      vi.mocked(mockParticipantRepository.findById).mockResolvedValue(mockParticipant as any)
      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockParticipantRepository.hasStartedAttempt).mockResolvedValue(false)

      // Act
      const result = await participantService.removeParticipant(input, userId)

      // Assert
      expect(mockParticipantRepository.deleteById).toHaveBeenCalledWith(participantId)
      expect(mockParticipantCache.invalidateParticipants).toHaveBeenCalledWith(examId)
      expect(result.message).toBe('Participant removed successfully')
    })
  })

  describe('listParticipants', () => {
    it('should list participants using cache wrap', async () => {
      // Arrange
      const input: any = {
        examId,
        pagination: { page: 1, limit: 10 },
      }

      vi.mocked(mockParticipantCache.wrapParticipants).mockImplementation(
        (eid, p, l, s, fetcher) => fetcher()
      )
      vi.mocked(mockExamRepository.findById).mockResolvedValue({
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
      } as any)
      vi.mocked(mockParticipantRepository.findByExamId).mockResolvedValue([])

      // Act
      const result = await participantService.listParticipants(input, userId)

      // Assert
      expect(mockParticipantCache.wrapParticipants).toHaveBeenCalled()
      expect(result.data).toBeDefined()
    })
  })

  describe('getMyExams', () => {
    it('should get participant exams using cache wrap', async () => {
      // Arrange
      const input: any = {
        pagination: { page: 1, limit: 10 },
      }

      vi.mocked(mockParticipantCache.wrapMyExams).mockImplementation(
        (uid, p, l, s, st, ia, fetcher) => fetcher()
      )
      vi.mocked(mockParticipantRepository.findByUserId).mockResolvedValue([])

      // Act
      const result = await participantService.getMyExams(input, userId)

      // Assert
      expect(mockParticipantCache.wrapMyExams).toHaveBeenCalled()
      expect(result.data).toBeDefined()
    })
  })
})
