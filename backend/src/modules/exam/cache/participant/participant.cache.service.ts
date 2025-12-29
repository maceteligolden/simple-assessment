import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../../shared/service/cache.service'
import { ParticipantCacheKeys } from './participant.cache.keys'
import { ParticipantCacheInvalidator } from './participant.cache.invalidator'
import {
  ListParticipantsOutput,
  GetParticipantResultOutput,
  GetMyExamsOutput,
} from '../../interfaces/participant.interface'
import { logger } from '../../../../shared/util/logger'

/**
 * Participant Cache Service Interface
 */
export interface IParticipantCacheService {
  getParticipants(
    examId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<ListParticipantsOutput | null>
  wrapParticipants(
    examId: string,
    page: number,
    limit: number,
    search: string | undefined,
    fetcher: () => Promise<ListParticipantsOutput>
  ): Promise<ListParticipantsOutput>
  getParticipantResult(
    examId: string,
    participantId: string
  ): Promise<GetParticipantResultOutput | null>
  wrapParticipantResult(
    examId: string,
    participantId: string,
    fetcher: () => Promise<GetParticipantResultOutput>
  ): Promise<GetParticipantResultOutput>
  getMyExams(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
    isAvailable?: boolean
  ): Promise<GetMyExamsOutput | null>
  wrapMyExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    status: string | undefined,
    isAvailable: boolean | undefined,
    fetcher: () => Promise<GetMyExamsOutput>
  ): Promise<GetMyExamsOutput>
  getNotStartedExams(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    isAvailable?: boolean
  ): Promise<GetMyExamsOutput | null>
  wrapNotStartedExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    isAvailable: boolean | undefined,
    fetcher: () => Promise<GetMyExamsOutput>
  ): Promise<GetMyExamsOutput>
  setParticipants(
    examId: string,
    page: number,
    limit: number,
    search: string | undefined,
    data: ListParticipantsOutput,
    ttl?: number
  ): void
  setParticipantResult(
    examId: string,
    participantId: string,
    data: GetParticipantResultOutput,
    ttl?: number
  ): void
  setMyExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    status: string | undefined,
    isAvailable: boolean | undefined,
    data: GetMyExamsOutput,
    ttl?: number
  ): void
  setNotStartedExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    isAvailable: boolean | undefined,
    data: GetMyExamsOutput,
    ttl?: number
  ): void
  invalidateParticipants(examId: string): Promise<void>
  invalidateParticipantResult(examId: string, participantId: string): Promise<void>
  invalidateMyExams(userId: string): Promise<void>
  invalidateNotStartedExams(userId: string): Promise<void>
}

/**
 * Participant Cache Service Implementation
 * Provides caching for participant-related endpoints
 */
@injectable()
export class ParticipantCacheService implements IParticipantCacheService {
  private readonly DEFAULT_TTL = {
    PARTICIPANTS: 300, // 5 minutes
    PARTICIPANT_RESULT: 900, // 15 minutes
    MY_EXAMS: 180, // 3 minutes
    NOT_STARTED_EXAMS: 180, // 3 minutes
  } as const

  constructor(
    @inject('ICacheService')
    private readonly baseCache: ICacheService,
    @inject('ParticipantCacheInvalidator')
    private readonly invalidator: ParticipantCacheInvalidator
  ) {}

  async getParticipants(
    examId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<ListParticipantsOutput | null> {
    try {
      const key = ParticipantCacheKeys.participants(examId, page, limit, search)
      const cached = this.baseCache.get<ListParticipantsOutput>(key)
      if (cached) {
        logger.debug('Cache hit for participants list', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting participants from cache', error)
      return null
    }
  }

  async wrapParticipants(
    examId: string,
    page: number,
    limit: number,
    search: string | undefined,
    fetcher: () => Promise<ListParticipantsOutput>
  ): Promise<ListParticipantsOutput> {
    const cached = await this.getParticipants(examId, page, limit, search)
    if (cached) return cached

    const result = await fetcher()
    this.setParticipants(examId, page, limit, search, result)
    return result
  }

  setParticipants(
    examId: string,
    page: number,
    limit: number,
    search: string | undefined,
    data: ListParticipantsOutput,
    ttl?: number
  ): void {
    try {
      const key = ParticipantCacheKeys.participants(examId, page, limit, search)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.PARTICIPANTS)
      logger.debug('Cache set for participants list', { key, ttl: ttl || this.DEFAULT_TTL.PARTICIPANTS })
    } catch (error) {
      logger.error('Error setting participants in cache', error)
    }
  }

  async getParticipantResult(
    examId: string,
    participantId: string
  ): Promise<GetParticipantResultOutput | null> {
    try {
      const key = ParticipantCacheKeys.participantResult(examId, participantId)
      const cached = this.baseCache.get<GetParticipantResultOutput>(key)
      if (cached) {
        logger.debug('Cache hit for participant result', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting participant result from cache', error)
      return null
    }
  }

  async wrapParticipantResult(
    examId: string,
    participantId: string,
    fetcher: () => Promise<GetParticipantResultOutput>
  ): Promise<GetParticipantResultOutput> {
    const cached = await this.getParticipantResult(examId, participantId)
    if (cached) return cached

    const result = await fetcher()
    this.setParticipantResult(examId, participantId, result)
    return result
  }

  setParticipantResult(
    examId: string,
    participantId: string,
    data: GetParticipantResultOutput,
    ttl?: number
  ): void {
    try {
      const key = ParticipantCacheKeys.participantResult(examId, participantId)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.PARTICIPANT_RESULT)
      logger.debug('Cache set for participant result', { key, ttl: ttl || this.DEFAULT_TTL.PARTICIPANT_RESULT })
    } catch (error) {
      logger.error('Error setting participant result in cache', error)
    }
  }

  async getMyExams(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
    isAvailable?: boolean
  ): Promise<GetMyExamsOutput | null> {
    try {
      const key = ParticipantCacheKeys.myExams(userId, page, limit, search, status, isAvailable)
      const cached = this.baseCache.get<GetMyExamsOutput>(key)
      if (cached) {
        logger.debug('Cache hit for my exams', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting my exams from cache', error)
      return null
    }
  }

  async wrapMyExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    status: string | undefined,
    isAvailable: boolean | undefined,
    fetcher: () => Promise<GetMyExamsOutput>
  ): Promise<GetMyExamsOutput> {
    const cached = await this.getMyExams(userId, page, limit, search, status, isAvailable)
    if (cached) return cached

    const result = await fetcher()
    this.setMyExams(userId, page, limit, search, status, isAvailable, result)
    return result
  }

  setMyExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    status: string | undefined,
    isAvailable: boolean | undefined,
    data: GetMyExamsOutput,
    ttl?: number
  ): void {
    try {
      const key = ParticipantCacheKeys.myExams(userId, page, limit, search, status, isAvailable)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.MY_EXAMS)
      logger.debug('Cache set for my exams', { key, ttl: ttl || this.DEFAULT_TTL.MY_EXAMS })
    } catch (error) {
      logger.error('Error setting my exams in cache', error)
    }
  }

  async getNotStartedExams(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    isAvailable?: boolean
  ): Promise<GetMyExamsOutput | null> {
    try {
      const key = ParticipantCacheKeys.notStartedExams(userId, page, limit, search, isAvailable)
      const cached = this.baseCache.get<GetMyExamsOutput>(key)
      if (cached) {
        logger.debug('Cache hit for not-started exams', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting not-started exams from cache', error)
      return null
    }
  }

  async wrapNotStartedExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    isAvailable: boolean | undefined,
    fetcher: () => Promise<GetMyExamsOutput>
  ): Promise<GetMyExamsOutput> {
    const cached = await this.getNotStartedExams(userId, page, limit, search, isAvailable)
    if (cached) return cached

    const result = await fetcher()
    this.setNotStartedExams(userId, page, limit, search, isAvailable, result)
    return result
  }

  setNotStartedExams(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
    isAvailable: boolean | undefined,
    data: GetMyExamsOutput,
    ttl?: number
  ): void {
    try {
      const key = ParticipantCacheKeys.notStartedExams(userId, page, limit, search, isAvailable)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.NOT_STARTED_EXAMS)
      logger.debug('Cache set for not-started exams', { key, ttl: ttl || this.DEFAULT_TTL.NOT_STARTED_EXAMS })
    } catch (error) {
      logger.error('Error setting not-started exams in cache', error)
    }
  }

  async invalidateParticipants(examId: string): Promise<void> {
    return this.invalidator.invalidateParticipants(examId)
  }

  async invalidateParticipantResult(examId: string, participantId: string): Promise<void> {
    return this.invalidator.invalidateParticipantResult(examId, participantId)
  }

  async invalidateMyExams(userId: string): Promise<void> {
    return this.invalidator.invalidateMyExams(userId)
  }

  async invalidateNotStartedExams(userId: string): Promise<void> {
    return this.invalidator.invalidateNotStartedExams(userId)
  }
}

