/**
 * Exam Cache Keys
 * Generates type-safe cache keys for exam-related endpoints
 */
export class ExamCacheKeys {
  private static readonly PREFIX = 'exam'

  /**
   * Generate cache key for exam list
   */
  static examList(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): string {
    const parts = [this.PREFIX, 'list', userId, `page:${page}`, `limit:${limit}`]
    if (search) {
      parts.push(`search:${search}`)
    }
    return parts.join(':')
  }

  /**
   * Generate cache key for exam detail
   */
  static examDetail(examId: string): string {
    return `${this.PREFIX}:detail:${examId}`
  }

  /**
   * Generate cache key for exam by access code
   */
  static examByCode(accessCode: string): string {
    return `${this.PREFIX}:code:${accessCode}`
  }

  /**
   * Generate cache key for exam results
   */
  static examResults(examId: string, page: number, limit: number): string {
    return `${this.PREFIX}:results:${examId}:page:${page}:limit:${limit}`
  }

  /**
   * Generate pattern for exam list invalidation
   */
  static examListPattern(userId?: string): string {
    if (userId) {
      return `${this.PREFIX}:list:${userId}:`
    }
    return `${this.PREFIX}:list:`
  }

  /**
   * Generate pattern for exam results invalidation
   */
  static examResultsPattern(examId: string): string {
    return `${this.PREFIX}:results:${examId}:`
  }
}

