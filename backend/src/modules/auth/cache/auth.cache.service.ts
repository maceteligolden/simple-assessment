import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../shared/service/cache.service'
import { AuthCacheKeys } from './auth.cache.keys'
import { AuthCacheInvalidator } from './auth.cache.invalidator'
import { UserProfileOutput } from '../interfaces/auth.interface'
import { logger } from '../../../shared/util/logger'

/**
 * Auth Cache Service Interface
 */
export interface IAuthCacheService {
  getUserById(userId: string): Promise<UserProfileOutput | null>
  wrapUserById(
    userId: string,
    fetcher: () => Promise<UserProfileOutput>
  ): Promise<UserProfileOutput>
  getUserByEmail(email: string): Promise<UserProfileOutput | null>
  wrapUserByEmail(
    email: string,
    fetcher: () => Promise<UserProfileOutput | null>
  ): Promise<UserProfileOutput | null>
  setUserById(userId: string, data: UserProfileOutput, ttl?: number): void
  setUserByEmail(email: string, data: UserProfileOutput, ttl?: number): void
  invalidateUser(userId: string, email?: string): Promise<void>
}

/**
 * Auth Cache Service Implementation
 * Provides caching for auth-related endpoints
 */
@injectable()
export class AuthCacheService implements IAuthCacheService {
  private readonly DEFAULT_TTL = {
    USER_PROFILE: 600, // 10 minutes
  } as const

  constructor(
    @inject('ICacheService')
    private readonly baseCache: ICacheService,
    @inject('AuthCacheInvalidator')
    private readonly invalidator: AuthCacheInvalidator
  ) {}

  async getUserById(userId: string): Promise<UserProfileOutput | null> {
    try {
      const key = AuthCacheKeys.userProfile(userId)
      const cached = this.baseCache.get<UserProfileOutput>(key)
      if (cached) {
        logger.debug('Cache hit for user profile by ID', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting user profile by ID from cache', error)
      return null
    }
  }

  async wrapUserById(
    userId: string,
    fetcher: () => Promise<UserProfileOutput>
  ): Promise<UserProfileOutput> {
    const cached = await this.getUserById(userId)
    if (cached) return cached

    const result = await fetcher()
    this.setUserById(userId, result)
    return result
  }

  async getUserByEmail(email: string): Promise<UserProfileOutput | null> {
    try {
      const key = AuthCacheKeys.userByEmail(email)
      const cached = this.baseCache.get<UserProfileOutput>(key)
      if (cached) {
        logger.debug('Cache hit for user profile by email', { key })
        return cached
      }
      return null
    } catch (error) {
      logger.error('Error getting user profile by email from cache', error)
      return null
    }
  }

  async wrapUserByEmail(
    email: string,
    fetcher: () => Promise<UserProfileOutput | null>
  ): Promise<UserProfileOutput | null> {
    const cached = await this.getUserByEmail(email)
    if (cached) return cached

    const result = await fetcher()
    if (result) {
      this.setUserByEmail(email, result)
    }
    return result
  }

  setUserById(userId: string, data: UserProfileOutput, ttl?: number): void {
    try {
      const key = AuthCacheKeys.userProfile(userId)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.USER_PROFILE)
      logger.debug('Cache set for user profile by ID', {
        key,
        ttl: ttl || this.DEFAULT_TTL.USER_PROFILE,
      })
    } catch (error) {
      logger.error('Error setting user profile by ID in cache', error)
    }
  }

  setUserByEmail(email: string, data: UserProfileOutput, ttl?: number): void {
    try {
      const key = AuthCacheKeys.userByEmail(email)
      this.baseCache.set(key, data, ttl || this.DEFAULT_TTL.USER_PROFILE)
      logger.debug('Cache set for user profile by email', {
        key,
        ttl: ttl || this.DEFAULT_TTL.USER_PROFILE,
      })
    } catch (error) {
      logger.error('Error setting user profile by email in cache', error)
    }
  }

  async invalidateUser(userId: string, email?: string): Promise<void> {
    await this.invalidator.invalidateUserProfile(userId)
    if (email) {
      await this.invalidator.invalidateUserByEmail(email)
    }
  }
}

