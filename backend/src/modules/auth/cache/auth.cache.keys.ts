/**
 * Auth Cache Keys
 * Generates type-safe cache keys for auth-related endpoints
 */
export class AuthCacheKeys {
  private static readonly PREFIX = 'auth'

  /**
   * Generate cache key for user profile
   */
  static userProfile(userId: string): string {
    return `${this.PREFIX}:profile:${userId}`
  }

  /**
   * Generate cache key for user by email
   */
  static userByEmail(email: string): string {
    return `${this.PREFIX}:email:${email.toLowerCase()}`
  }
}

