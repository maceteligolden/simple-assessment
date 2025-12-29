import { injectable, inject } from 'tsyringe'
import { ICacheService } from '../../../shared/service/cache.service'
import { AuthCacheKeys } from './auth.cache.keys'
import { logger } from '../../../shared/util/logger'

/**
 * Auth Cache Invalidator
 * Handles cache invalidation for auth-related operations
 */
@injectable()
export class AuthCacheInvalidator {
  constructor(
    @inject('ICacheService')
    private readonly cacheService: ICacheService
  ) {}

  /**
   * Invalidate cache for user profile
   */
  async invalidateUserProfile(userId: string, email?: string): Promise<void> {
    try {
      this.cacheService.delete(AuthCacheKeys.userProfile(userId))
      if (email) {
        this.cacheService.delete(AuthCacheKeys.userByEmail(email))
      }
      logger.debug('Cache invalidated for user profile', { userId, email })
    } catch (error) {
      logger.error('Error invalidating user profile cache', error, { userId })
    }
  }

  /**
   * Invalidate cache for user by email
   */
  async invalidateUserByEmail(email: string): Promise<void> {
    try {
      this.cacheService.delete(AuthCacheKeys.userByEmail(email))
      logger.debug('Cache invalidated for user by email', { email })
    } catch (error) {
      logger.error('Error invalidating user by email cache', error, { email })
    }
  }
}

