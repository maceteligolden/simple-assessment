import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../../shared/service/cache.service'
import { AttemptCacheKeys } from './attempt.cache.keys'
import { AttemptCacheInvalidator } from './attempt.cache.invalidator'
import {
  GetAttemptResultsOutput,
  GetMyResultsOutput,
} from '../../interfaces/attempt.interface'
import { logger } from '../../../../shared/util/logger'

/**
 * Attempt Cache Service Interface
 */
export interface IAttemptCacheService {
  getAttemptResults(attemptId: string): Promise<GetAttemptResultsOutput | null>
  wrapAttemptResults(
    attemptId: string,
    fetcher: () => Promise<GetAttemptResultsOutput>
  ): Promise<GetAttemptResultsOutput>
  getMyResults(
    userId: string,
    page: number,
    limit: number
  ): Promise<GetMyResultsOutput | null>
  wrapMyResults(
    userId: string,
    page: number,
    limit: number,
    fetcher: () => Promise<GetMyResultsOutput>
  ): Promise<GetMyResultsOutput>
  setAttemptResults(attemptId: string, data: GetAttemptResultsOutput, ttl?: number): void
  invalidateAttemptResults(attemptId: string): Promise<void>
  invalidateMyResults(userId: string): Promise<void>
}

/**
 * Attempt Cache Service Implementation
 * Provides caching for attempt-related endpoints
 */
@injectable()
export class AttemptCacheService implements IAttemptCacheService {
  private readonly DEFAULT_TTL = {
    ATTEMPT_RESULTS: 1800, // 30 minutes
    MY_RESULTS: 300, // 5 minutes
  } as const

  constructor(
    @inject('ICacheService')
    private readonly baseCache: ICacheService,
    @inject('AttemptCacheInvalidator')
    private readonly invalidator: AttemptCacheInvalidator
  ) {}

  async getAttemptResults(attemptId: string): Promise<GetAttemptResultsOutput | null> {
    try {
      const key = AttemptCacheKeys.attemptResults(attemptId)
      const cached = this.baseCache.get<GetAttemptResultsOutput>(key)
      if (cached) {
        logger.debug('Cache hit for attempt results', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting attempt results from cache', error)
      return null
    }
  }

  async wrapAttemptResults(
    attemptId: string,
    fetcher: () => Promise<GetAttemptResultsOutput>
  ): Promise<GetAttemptResultsOutput> {
    const cached = await this.getAttemptResults(attemptId)
    if (cached) return cached

    const result = await fetcher()
    this.setAttemptResults(attemptId, result)
    return result
  }

  setAttemptResults(attemptId: string, data: GetAttemptResultsOutput, ttl?: number): void {
    try {
      const key = AttemptCacheKeys.attemptResults(attemptId)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.ATTEMPT_RESULTS)
      logger.debug('Cache set for attempt results', { key, ttl: ttl || this.DEFAULT_TTL.ATTEMPT_RESULTS })
    } catch (error) {
      logger.error('Error setting attempt results in cache', error)
    }
  }

  async getMyResults(
    userId: string,
    page: number,
    limit: number
  ): Promise<GetMyResultsOutput | null> {
    try {
      const key = AttemptCacheKeys.myResults(userId, page, limit)
      const cached = this.baseCache.get<GetMyResultsOutput>(key)
      if (cached) {
        logger.debug('Cache hit for my results', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting my results from cache', error)
      return null
    }
  }

  async wrapMyResults(
    userId: string,
    page: number,
    limit: number,
    fetcher: () => Promise<GetMyResultsOutput>
  ): Promise<GetMyResultsOutput> {
    const cached = await this.getMyResults(userId, page, limit)
    if (cached) return cached

    const result = await fetcher()
    this.setMyResults(userId, page, limit, result)
    return result
  }

  setMyResults(
    userId: string,
    page: number,
    limit: number,
    data: GetMyResultsOutput,
    ttl?: number
  ): void {
    try {
      const key = AttemptCacheKeys.myResults(userId, page, limit)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.MY_RESULTS)
      logger.debug('Cache set for my results', { key, ttl: ttl || this.DEFAULT_TTL.MY_RESULTS })
    } catch (error) {
      logger.error('Error setting my results in cache', error)
    }
  }

  async invalidateAttemptResults(attemptId: string): Promise<void> {
    return this.invalidator.invalidateAttemptResults(attemptId)
  }

  async invalidateMyResults(userId: string): Promise<void> {
    return this.invalidator.invalidateMyResults(userId)
  }
}

