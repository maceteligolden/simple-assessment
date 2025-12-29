import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../shared/service/cache.service'
import { ExamCacheKeys } from './exam.cache.keys'
import { logger } from '../../../shared/util/logger'

/**
 * Exam Cache Invalidator
 * Handles cache invalidation for exam-related operations
 */
@injectable()
export class ExamCacheInvalidator {
  constructor(
    @inject('ICacheService')
    private readonly cacheService: ICacheService
  ) {}

  /**
   * Invalidate cache for a specific exam
   */
  async invalidateExam(examId: string): Promise<void> {
    try {
      // Invalidate exam detail
      this.cacheService.delete(ExamCacheKeys.examDetail(examId))

      // Invalidate exam results (all paginated versions)
      const allKeys = this.cacheService.keys()
      const resultsPattern = ExamCacheKeys.examResultsPattern(examId)
      const resultsKeys = allKeys.filter(key => key.startsWith(resultsPattern))
      if (resultsKeys.length > 0) {
        this.cacheService.deleteMany(resultsKeys)
      }

      logger.debug('Cache invalidated for exam', { examId, resultsKeysCount: resultsKeys.length })
    } catch (error) {
      logger.error('Error invalidating exam cache', error, { examId })
    }
  }

  /**
   * Invalidate cache for exam list
   */
  async invalidateExamList(userId?: string): Promise<void> {
    try {
      const allKeys = this.cacheService.keys()
      const pattern = ExamCacheKeys.examListPattern(userId)
      const listKeys = allKeys.filter(key => key.startsWith(pattern))
      
      if (listKeys.length > 0) {
        this.cacheService.deleteMany(listKeys)
        logger.debug('Cache invalidated for exam list', { userId, count: listKeys.length })
      }
    } catch (error) {
      logger.error('Error invalidating exam list cache', error, { userId })
    }
  }

  /**
   * Invalidate cache for exam by access code
   */
  async invalidateExamByCode(accessCode: string): Promise<void> {
    try {
      this.cacheService.delete(ExamCacheKeys.examByCode(accessCode))
      logger.debug('Cache invalidated for exam by code', { accessCode })
    } catch (error) {
      logger.error('Error invalidating exam by code cache', error, { accessCode })
    }
  }

  /**
   * Invalidate cache for exam results
   */
  async invalidateExamResults(examId: string): Promise<void> {
    try {
      const allKeys = this.cacheService.keys()
      const pattern = ExamCacheKeys.examResultsPattern(examId)
      const resultsKeys = allKeys.filter(key => key.startsWith(pattern))
      
      if (resultsKeys.length > 0) {
        this.cacheService.deleteMany(resultsKeys)
        logger.debug('Cache invalidated for exam results', { examId, count: resultsKeys.length })
      }
    } catch (error) {
      logger.error('Error invalidating exam results cache', error, { examId })
    }
  }

  /**
   * Invalidate all exam-related cache entries
   */
  async invalidateAllExamRelated(examId: string): Promise<void> {
    await Promise.all([
      this.invalidateExam(examId),
      this.invalidateExamResults(examId),
    ])
  }
}

