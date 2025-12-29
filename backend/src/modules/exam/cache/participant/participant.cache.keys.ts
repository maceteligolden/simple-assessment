/**
 * Participant Cache Keys
 * Generates type-safe cache keys for participant-related endpoints
 */
export class ParticipantCacheKeys {
  private static readonly PREFIX = 'participant'

  /**
   * Generate cache key for participants list
   */
  static participants(
    examId: string,
    page: number,
    limit: number,
    search?: string
  ): string {
    const parts = [this.PREFIX, 'list', examId, `page:${page}`, `limit:${limit}`]
    if (search) {
      parts.push(`search:${search}`)
    }
    return parts.join(':')
  }

  /**
   * Generate cache key for participant result
   */
  static participantResult(examId: string, participantId: string): string {
    return `${this.PREFIX}:result:${examId}:${participantId}`
  }

  /**
   * Generate cache key for my exams
   */
  static myExams(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
    isAvailable?: boolean
  ): string {
    const parts = [this.PREFIX, 'my-exams', userId, `page:${page}`, `limit:${limit}`]
    if (search) parts.push(`search:${search}`)
    if (status) parts.push(`status:${status}`)
    if (isAvailable !== undefined) parts.push(`available:${isAvailable}`)
    return parts.join(':')
  }

  /**
   * Generate cache key for not-started exams
   */
  static notStartedExams(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    isAvailable?: boolean
  ): string {
    const parts = [this.PREFIX, 'not-started', userId, `page:${page}`, `limit:${limit}`]
    if (search) parts.push(`search:${search}`)
    if (isAvailable !== undefined) parts.push(`available:${isAvailable}`)
    return parts.join(':')
  }

  /**
   * Generate pattern for participants list invalidation
   */
  static participantsPattern(examId: string): string {
    return `${this.PREFIX}:list:${examId}:`
  }

  /**
   * Generate pattern for my exams invalidation
   */
  static myExamsPattern(userId: string): string {
    return `${this.PREFIX}:my-exams:${userId}:`
  }

  /**
   * Generate pattern for not-started exams invalidation
   */
  static notStartedExamsPattern(userId: string): string {
    return `${this.PREFIX}:not-started:${userId}:`
  }
}

