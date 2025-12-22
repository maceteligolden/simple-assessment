import { logger } from './logger'
import { ISessionService } from '../service/session.service'
import { ENV } from '../constants'

/**
 * Session Cleanup Job
 * Periodically cleans up expired sessions
 */
export class SessionCleanupJob {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(private readonly sessionService: ISessionService) {
    logger.debug('SessionCleanupJob initialized')
  }

  /**
   * Start the cleanup job
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Session cleanup job is already running')
      return
    }

    logger.info('Starting session cleanup job', {
      intervalMinutes: ENV.SESSION_CLEANUP_INTERVAL_MINUTES,
    })

    this.isRunning = true

    // Run immediately on start
    this.runCleanup()

    // Then run at intervals
    this.intervalId = setInterval(
      () => {
        this.runCleanup()
      },
      ENV.SESSION_CLEANUP_INTERVAL_MINUTES * 60 * 1000
    )
  }

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Session cleanup job is not running')
      return
    }

    logger.info('Stopping session cleanup job')

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
  }

  /**
   * Run the cleanup process
   */
  private async runCleanup(): Promise<void> {
    try {
      logger.debug('Running session cleanup')
      const count = await this.sessionService.cleanupExpiredSessions()
      logger.info('Session cleanup completed', { revokedSessions: count })
    } catch (error) {
      logger.error('Error during session cleanup', error)
    }
  }

  /**
   * Check if the job is running
   */
  isJobRunning(): boolean {
    return this.isRunning
  }
}
