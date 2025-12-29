import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamAttemptService } from '../../../../src/modules/exam/services/exam-attempt.service'
import {
  IExamRepository,
  IQuestionRepository,
  IExamParticipantRepository,
  IExamAttemptRepository,
} from '../../../../src/shared/repository'
import { IAttemptCacheService, IParticipantCacheService } from '../../../../src/modules/exam/cache'
import { Types } from 'mongoose'
import { QuestionFactory } from '../../../../src/modules/exam/factory/question.factory'
import { TransactionManager } from '../../../../src/shared/util'

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
  findByExamIdForParticipant: vi.fn(),
  findByExamIdWithCorrectAnswers: vi.fn(),
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

const mockAttemptCache: IAttemptCacheService = {
  getAttemptResults: vi.fn(),
  setAttemptResults: vi.fn(),
  invalidateAttemptResults: vi.fn(),
  getMyResults: vi.fn(),
  setMyResults: vi.fn(),
  invalidateMyResults: vi.fn(),
  wrapAttemptResults: vi.fn(),
  wrapMyResults: vi.fn(),
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

// Mock TransactionManager
vi.mock('../../../../src/shared/util/transaction.manager', () => ({
  TransactionManager: {
    withTransaction: vi.fn(callback => callback('mock-session')),
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
      mockAttemptRepository,
      mockAttemptCache,
      mockParticipantCache
    )
  })

  describe('startExam', () => {
    it('should start exam successfully and invalidate caches', async () => {
      // Arrange
      const input: any = { accessCode: 'ABC123' }
      const mockParticipant = {
        _id: new Types.ObjectId(participantId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
        isUsed: false,
      }
      const mockExam = {
        _id: new Types.ObjectId(examId),
        title: 'Test Exam',
        duration: 60,
        availableAnytime: true,
      }
      const mockAttempt = {
        _id: new Types.ObjectId(attemptId),
        examId: new Types.ObjectId(examId),
        participantId: new Types.ObjectId(participantId),
        userId: new Types.ObjectId(userId),
        startedAt: new Date(),
      }

      vi.mocked(mockParticipantRepository.findByAccessCode).mockResolvedValue(mockParticipant as any)
      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockQuestionRepository.findByExamId).mockResolvedValue([{ _id: 'q1' }] as any)
      vi.mocked(mockAttemptRepository.create).mockResolvedValue(mockAttempt as any)
      vi.mocked(mockAttemptRepository.updateById).mockResolvedValue(mockAttempt as any)

      // Act
      const result = await attemptService.startExam(input, userId)

      // Assert
      expect(TransactionManager.withTransaction).toHaveBeenCalled()
      expect(mockParticipantCache.invalidateMyExams).toHaveBeenCalledWith(userId)
      expect(mockParticipantCache.invalidateParticipants).toHaveBeenCalledWith(examId)
      expect(result.attemptId).toBe(attemptId)
    })
  })

  describe('getNextQuestion', () => {
    it('should get next question and update activity', async () => {
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
      const mockExam = { _id: new Types.ObjectId(examId), duration: 60 }
      const mockQuestion = { _id: new Types.ObjectId('507f1f77bcf86cd799439016'), type: 'multiple-choice' }
      const mockHandler = { render: vi.fn().mockReturnValue({ id: '507f1f77bcf86cd799439016' }) }

      vi.mocked(mockAttemptRepository.findById).mockResolvedValue(mockAttempt as any)
      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockQuestionRepository.findByExamIdForParticipant).mockResolvedValue([mockQuestion] as any)
      vi.mocked(QuestionFactory.create).mockReturnValue(mockHandler as any)

      // Act
      const result = await attemptService.getNextQuestion(input, userId)

      // Assert
      expect(mockAttemptRepository.updateActivity).toHaveBeenCalledWith(attemptId)
      expect(result.question).toBeDefined()
    })
  })

  describe('submitExam', () => {
    it('should submit exam and invalidate caches', async () => {
      // Arrange
      const input: any = { attemptId }
      const mockAttempt = {
        _id: new Types.ObjectId(attemptId),
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
        status: 'in-progress',
        participantId: new Types.ObjectId(participantId),
        answeredQuestions: [0],
        answers: new Map(),
        startedAt: new Date(),
      }
      const mockExam = { _id: new Types.ObjectId(examId), duration: 60, passPercentage: 70 }
      const mockQuestion = { _id: new Types.ObjectId('507f1f77bcf86cd799439016'), points: 1, type: 'multiple-choice' }

      vi.mocked(mockAttemptRepository.findById).mockResolvedValue(mockAttempt as any)
      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockQuestionRepository.findByExamIdWithCorrectAnswers).mockResolvedValue([mockQuestion] as any)
      vi.mocked(mockAttemptRepository.updateById).mockResolvedValue(mockAttempt as any)

      // Act
      const result = await attemptService.submitExam(input, userId)

      // Assert
      expect(TransactionManager.withTransaction).toHaveBeenCalled()
      expect(mockAttemptCache.invalidateAttemptResults).toHaveBeenCalledWith(attemptId)
      expect(mockParticipantCache.invalidateParticipantResult).toHaveBeenCalled()
      expect(result.attemptId).toBe(attemptId)
    })
  })
})
