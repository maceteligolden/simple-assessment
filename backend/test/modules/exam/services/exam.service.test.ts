import 'reflect-metadata'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExamService } from '../../../../src/modules/exam/services/exam.service'
import {
  IExamRepository,
  IQuestionRepository,
  IExamParticipantRepository,
} from '../../../../src/shared/repository'
import { IExamCacheService } from '../../../../src/modules/exam/cache'
import { Types } from 'mongoose'
import { QuestionFactory } from '../../../../src/modules/exam/factory/question.factory'
import { Sanitizer } from '../../../../src/shared/util'

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

// Mock Sanitizer
vi.mock('../../../../src/shared/util/sanitizer', () => ({
  Sanitizer: {
    sanitize: vi.fn(val => val),
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
      mockParticipantRepository,
      mockExamCache
    )
  })

  describe('createExam', () => {
    it('should create a new exam successfully and invalidate cache', async () => {
      // Arrange
      const input: any = {
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
        randomizeQuestions: false,
        showResultsImmediately: false,
        passPercentage: 50,
      }

      const mockExam = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        availableAnytime: true,
        randomizeQuestions: false,
        showResultsImmediately: false,
        passPercentage: 50,
        createdAt: new Date(),
      }

      vi.mocked(mockExamRepository.create).mockResolvedValue(mockExam as any)

      // Act
      const result = await examService.createExam(input, userId)

      // Assert
      expect(mockExamRepository.create).toHaveBeenCalled()
      expect(mockExamCache.invalidateExamList).toHaveBeenCalledWith(userId)
      expect(result.id).toBe(mockExam._id.toString())
      expect(Sanitizer.sanitize).toHaveBeenCalled()
    })
  })

  describe('listExams', () => {
    it('should list exams using cache wrap', async () => {
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

      vi.mocked(mockExamCache.wrapExamList).mockImplementation(
        (uid, p, l, s, fetcher) => fetcher()
      )
      vi.mocked(mockExamRepository.findByCreatorId).mockResolvedValue(mockExams as any)
      vi.mocked(mockExamRepository.getQuestionCount).mockResolvedValue(5)
      vi.mocked(mockExamRepository.getParticipantCount).mockResolvedValue(10)

      // Act
      const result = await examService.listExams(input, userId)

      // Assert
      expect(mockExamCache.wrapExamList).toHaveBeenCalled()
      expect(mockExamRepository.findByCreatorId).toHaveBeenCalled()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].questionCount).toBe(5)
      expect(result.data[0].participantCount).toBe(10)
    })
  })

  describe('getExam', () => {
    it('should get exam details using cache wrap and optimized repository method', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const input: any = { examId }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Test Exam',
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockExamCache.wrapExamDetail).mockImplementation((eid, fetcher) =>
        fetcher()
      )
      vi.mocked(mockExamRepository.findByIdForExaminer).mockResolvedValue(
        mockExam as any
      )
      vi.mocked(mockParticipantRepository.findByExamId).mockResolvedValue([])

      // Act
      const result = await examService.getExam(input, userId)

      // Assert
      expect(mockExamCache.wrapExamDetail).toHaveBeenCalledWith(
        examId,
        expect.any(Function)
      )
      expect(mockExamRepository.findByIdForExaminer).toHaveBeenCalledWith(examId)
      expect(result.id).toBe(examId)
    })
  })

  describe('updateExam', () => {
    it('should update exam and invalidate cache', async () => {
      // Arrange
      const examId = '507f1f77bcf86cd799439012'
      const input: any = {
        examId,
        title: 'Updated Exam',
      }

      const mockExam = {
        _id: new Types.ObjectId(examId),
        creatorId: new Types.ObjectId(userId),
        title: 'Old Title',
      }

      const updatedExam = {
        ...mockExam,
        title: 'Updated Exam',
        updatedAt: new Date(),
      }

      vi.mocked(mockExamRepository.findById).mockResolvedValue(mockExam as any)
      vi.mocked(mockExamRepository.updateById).mockResolvedValue(updatedExam as any)

      // Act
      const result = await examService.updateExam(input, userId)

      // Assert
      expect(mockExamRepository.updateById).toHaveBeenCalled()
      expect(mockExamCache.invalidateExam).toHaveBeenCalledWith(examId)
      expect(mockExamCache.invalidateExamList).toHaveBeenCalledWith(userId)
      expect(result.title).toBe('Updated Exam')
    })
  })

  describe('getExamByCode', () => {
    it('should get exam by code for participant using cache wrap', async () => {
      // Arrange
      const accessCode = 'ABC123'
      const input: any = { accessCode }

      const mockParticipant = {
        _id: new Types.ObjectId(),
        examId: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        accessCode,
      }

      const mockExam = {
        _id: mockParticipant.examId,
        title: 'Participant Exam',
        questions: [],
      }

      vi.mocked(mockExamCache.wrapExamByCode).mockImplementation((code, fetcher) =>
        fetcher()
      )
      vi.mocked(mockParticipantRepository.findByAccessCode).mockResolvedValue(
        mockParticipant as any
      )
      vi.mocked(mockExamRepository.findByIdForParticipant).mockResolvedValue(
        mockExam as any
      )

      // Act
      const result = await examService.getExamByCode(input, userId)

      // Assert
      expect(mockExamCache.wrapExamByCode).toHaveBeenCalledWith(
        accessCode,
        expect.any(Function)
      )
      expect(mockExamRepository.findByIdForParticipant).toHaveBeenCalled()
      expect(result.title).toBe('Participant Exam')
    })
  })
})
