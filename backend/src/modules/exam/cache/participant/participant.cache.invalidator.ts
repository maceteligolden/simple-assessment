import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../../shared/service/cache.service'
import { ParticipantCacheKeys } from './participant.cache.keys'
import { logger } from '../../../../shared/util/logger'

/**
 * Participant Cache Invalidator
 * Handles cache invalidation for participant-related operations
 */
@injectable()
export class ParticipantCacheInvalidator {
  constructor(
    @inject('ICacheService')
    private readonly cacheService: ICacheService
  ) {}

  /**
   * Invalidate cache for participants list
   */
  async invalidateParticipants(examId: string): Promise<void> {
    try {
      const allKeys = this.cacheService.keys()
      const pattern = ParticipantCacheKeys.participantsPattern(examId)
      const participantKeys = allKeys.filter(key => key.startsWith(pattern))
      
      if (participantKeys.length > 0) {
        this.cacheService.deleteMany(participantKeys)
        logger.debug('Cache invalidated for participants', { examId, count: participantKeys.length })
      }
    } catch (error) {
      logger.error('Error invalidating participants cache', error, { examId })
    }
  }

  /**
   * Invalidate cache for participant result
   */
  async invalidateParticipantResult(examId: string, participantId: string): Promise<void> {
    try {
      this.cacheService.delete(ParticipantCacheKeys.participantResult(examId, participantId))
      logger.debug('Cache invalidated for participant result', { examId, participantId })
    } catch (error) {
      logger.error('Error invalidating participant result cache', error, { examId, participantId })
    }
  }

  /**
   * Invalidate cache for my exams
   */
  async invalidateMyExams(userId: string): Promise<void> {
    try {
      const allKeys = this.cacheService.keys()
      const pattern = ParticipantCacheKeys.myExamsPattern(userId)
      const myExamsKeys = allKeys.filter(key => key.startsWith(pattern))
      
      if (myExamsKeys.length > 0) {
        this.cacheService.deleteMany(myExamsKeys)
        logger.debug('Cache invalidated for my exams', { userId, count: myExamsKeys.length })
      }
    } catch (error) {
      logger.error('Error invalidating my exams cache', error, { userId })
    }
  }

  /**
   * Invalidate cache for not-started exams
   */
  async invalidateNotStartedExams(userId: string): Promise<void> {
    try {
      const allKeys = this.cacheService.keys()
      const pattern = ParticipantCacheKeys.notStartedExamsPattern(userId)
      const notStartedKeys = allKeys.filter(key => key.startsWith(pattern))
      
      if (notStartedKeys.length > 0) {
        this.cacheService.deleteMany(notStartedKeys)
        logger.debug('Cache invalidated for not-started exams', { userId, count: notStartedKeys.length })
      }
    } catch (error) {
      logger.error('Error invalidating not-started exams cache', error, { userId })
    }
  }

  /**
   * Invalidate all participant-related cache for a user
   */
  async invalidateAllUserParticipantCache(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateMyExams(userId),
      this.invalidateNotStartedExams(userId),
    ])
  }
}

