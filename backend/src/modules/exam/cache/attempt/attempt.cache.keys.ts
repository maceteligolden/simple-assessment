/**
 * Attempt Cache Keys
 * Generates type-safe cache keys for attempt-related endpoints
 */
export class AttemptCacheKeys {
  private static readonly PREFIX = 'attempt'

  /**
   * Generate cache key for attempt results
   */
  static attemptResults(attemptId: string): string {
    return `${this.PREFIX}:results:${attemptId}`
  }

  /**
   * Generate cache key for my results
   */
  static myResults(userId: string, page: number, limit: number): string {
    return `${this.PREFIX}:my-results:${userId}:page:${page}:limit:${limit}`
  }

  /**
   * Generate pattern for my results invalidation
   */
  static myResultsPattern(userId: string): string {
    return `${this.PREFIX}:my-results:${userId}:`
  }
}

