import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../shared/service/cache.service'
import { ExamCacheKeys } from './exam.cache.keys'
import { ExamCacheInvalidator } from './exam.cache.invalidator'
import { ListExamsOutput, GetExamOutput, GetExamResultsOutput, GetExamByCodeOutput } from '../interfaces/exam.interface'
import { logger } from '../../../shared/util/logger'

/**
 * Exam Cache Service Interface
 */
export interface IExamCacheService {
  getExamList(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<ListExamsOutput | null>
  wrapExamList(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    fetcher: () => Promise<ListExamsOutput>
  ): Promise<ListExamsOutput>
  getExamDetail(examId: string): Promise<GetExamOutput | null>
  wrapExamDetail(
    examId: string,
    fetcher: () => Promise<GetExamOutput>
  ): Promise<GetExamOutput>
  getExamByCode(accessCode: string): Promise<GetExamByCodeOutput | null>
  wrapExamByCode(
    accessCode: string,
    fetcher: () => Promise<GetExamByCodeOutput>
  ): Promise<GetExamByCodeOutput>
  getExamResults(
    examId: string,
    page: number,
    limit: number
  ): Promise<GetExamResultsOutput | null>
  wrapExamResults(
    examId: string,
    page: number,
    limit: number,
    fetcher: () => Promise<GetExamResultsOutput>
  ): Promise<GetExamResultsOutput>
  setExamList(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    data: ListExamsOutput,
    ttl?: number
  ): void
  setExamDetail(examId: string, data: GetExamOutput, ttl?: number): void
  setExamByCode(accessCode: string, data: GetExamByCodeOutput, ttl?: number): void
  setExamResults(
    examId: string,
    page: number,
    limit: number,
    data: GetExamResultsOutput,
    ttl?: number
  ): void
  invalidateExam(examId: string): Promise<void>
  invalidateExamList(userId?: string): Promise<void>
  invalidateExamByCode(accessCode: string): Promise<void>
  invalidateExamResults(examId: string): Promise<void>
}

/**
 * Exam Cache Service Implementation
 * Provides caching for exam-related endpoints
 */
@injectable()
export class ExamCacheService implements IExamCacheService {
  private readonly DEFAULT_TTL = {
    EXAM_LIST: 300, // 5 minutes
    EXAM_DETAIL: 600, // 10 minutes
    EXAM_BY_CODE: 900, // 15 minutes
    EXAM_RESULTS: 120, // 2 minutes
  } as const

  constructor(
    @inject('ICacheService')
    private readonly baseCache: ICacheService,
    @inject('ExamCacheInvalidator')
    private readonly invalidator: ExamCacheInvalidator
  ) {}

  async getExamList(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<ListExamsOutput | null> {
    try {
      const key = ExamCacheKeys.examList(userId, page, limit, search)
      const cached = this.baseCache.get<ListExamsOutput>(key)
      if (cached) {
        logger.debug('Cache hit for exam list', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting exam list from cache', error)
      return null
    }
  }

  async wrapExamList(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    fetcher: () => Promise<ListExamsOutput>
  ): Promise<ListExamsOutput> {
    const cached = await this.getExamList(userId, page, limit, search)
    if (cached) return cached

    const result = await fetcher()
    this.setExamList(userId, page, limit, search, result)
    return result
  }

  setExamList(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    data: ListExamsOutput,
    ttl?: number
  ): void {
    try {
      const key = ExamCacheKeys.examList(userId, page, limit, search)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.EXAM_LIST)
      logger.debug('Cache set for exam list', { key, ttl: ttl || this.DEFAULT_TTL.EXAM_LIST })
    } catch (error) {
      logger.error('Error setting exam list in cache', error)
    }
  }

  async getExamDetail(examId: string): Promise<GetExamOutput | null> {
    try {
      const key = ExamCacheKeys.examDetail(examId)
      const cached = this.baseCache.get<GetExamOutput>(key)
      if (cached) {
        logger.debug('Cache hit for exam detail', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting exam detail from cache', error)
      return null
    }
  }

  async wrapExamDetail(
    examId: string,
    fetcher: () => Promise<GetExamOutput>
  ): Promise<GetExamOutput> {
    const cached = await this.getExamDetail(examId)
    if (cached) return cached

    const result = await fetcher()
    this.setExamDetail(examId, result)
    return result
  }

  setExamDetail(examId: string, data: GetExamOutput, ttl?: number): void {
    try {
      const key = ExamCacheKeys.examDetail(examId)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.EXAM_DETAIL)
      logger.debug('Cache set for exam detail', { key, ttl: ttl || this.DEFAULT_TTL.EXAM_DETAIL })
    } catch (error) {
      logger.error('Error setting exam detail in cache', error)
    }
  }

  async getExamByCode(accessCode: string): Promise<GetExamByCodeOutput | null> {
    try {
      const key = ExamCacheKeys.examByCode(accessCode)
      const cached = this.baseCache.get<GetExamByCodeOutput>(key)
      if (cached) {
        logger.debug('Cache hit for exam by code', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting exam by code from cache', error)
      return null
    }
  }

  async wrapExamByCode(
    accessCode: string,
    fetcher: () => Promise<GetExamByCodeOutput>
  ): Promise<GetExamByCodeOutput> {
    const cached = await this.getExamByCode(accessCode)
    if (cached) return cached

    const result = await fetcher()
    this.setExamByCode(accessCode, result)
    return result
  }

  setExamByCode(accessCode: string, data: GetExamByCodeOutput, ttl?: number): void {
    try {
      const key = ExamCacheKeys.examByCode(accessCode)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.EXAM_BY_CODE)
      logger.debug('Cache set for exam by code', { key, ttl: ttl || this.DEFAULT_TTL.EXAM_BY_CODE })
    } catch (error) {
      logger.error('Error setting exam by code in cache', error)
    }
  }

  async getExamResults(
    examId: string,
    page: number,
    limit: number
  ): Promise<GetExamResultsOutput | null> {
    try {
      const key = ExamCacheKeys.examResults(examId, page, limit)
      const cached = this.baseCache.get<GetExamResultsOutput>(key)
      if (cached) {
        logger.debug('Cache hit for exam results', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting exam results from cache', error)
      return null
    }
  }

  async wrapExamResults(
    examId: string,
    page: number,
    limit: number,
    fetcher: () => Promise<GetExamResultsOutput>
  ): Promise<GetExamResultsOutput> {
    const cached = await this.getExamResults(examId, page, limit)
    if (cached) return cached

    const result = await fetcher()
    this.setExamResults(examId, page, limit, result)
    return result
  }

  setExamResults(
    examId: string,
    page: number,
    limit: number,
    data: GetExamResultsOutput,
    ttl?: number
  ): void {
    try {
      const key = ExamCacheKeys.examResults(examId, page, limit)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.EXAM_RESULTS)
      logger.debug('Cache set for exam results', { key, ttl: ttl || this.DEFAULT_TTL.EXAM_RESULTS })
    } catch (error) {
      logger.error('Error setting exam results in cache', error)
    }
  }

  async invalidateExam(examId: string): Promise<void> {
    return this.invalidator.invalidateExam(examId)
  }

  async invalidateExamList(userId?: string): Promise<void> {
    return this.invalidator.invalidateExamList(userId)
  }

  async invalidateExamByCode(accessCode: string): Promise<void> {
    return this.invalidator.invalidateExamByCode(accessCode)
  }

  async invalidateExamResults(examId: string): Promise<void> {
    return this.invalidator.invalidateExamResults(examId)
  }
}

