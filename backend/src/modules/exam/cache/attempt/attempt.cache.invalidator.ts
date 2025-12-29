import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../../shared/service/cache.service'
import { AttemptCacheKeys } from './attempt.cache.keys'
import { logger } from '../../../../shared/util/logger'

/**
 * Attempt Cache Invalidator
 * Handles cache invalidation for attempt-related operations
 */
@injectable()
export class AttemptCacheInvalidator {
  constructor(
    @inject('ICacheService')
    private readonly cacheService: ICacheService
  ) {}

  /**
   * Invalidate cache for attempt results
   */
  async invalidateAttemptResults(attemptId: string): Promise<void> {
    try {
      this.cacheService.delete(AttemptCacheKeys.attemptResults(attemptId))
      logger.debug('Cache invalidated for attempt results', { attemptId })
    } catch (error) {
      logger.error('Error invalidating attempt results cache', error, { attemptId })
    }
  }

  /**
   * Invalidate cache for my results
   */
  async invalidateMyResults(userId: string): Promise<void> {
    try {
      const allKeys = this.cacheService.keys()
      const pattern = AttemptCacheKeys.myResultsPattern(userId)
      const myResultsKeys = allKeys.filter(key => key.startsWith(pattern))
      
      if (myResultsKeys.length > 0) {
        this.cacheService.deleteMany(myResultsKeys)
        logger.debug('Cache invalidated for my results', { userId, count: myResultsKeys.length })
      }
    } catch (error) {
      logger.error('Error invalidating my results cache', error, { userId })
    }
  }
}

