import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SessionCleanupJob } from '../../../src/shared/util/session-cleanup'
import { ISessionService } from '../../../src/shared/service/session.service'
import * as logger from '../../../src/shared/util/logger'

// Mock logger
vi.mock('../../../src/shared/util/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock ENV
vi.mock('../../../src/shared/constants', () => ({
  ENV: {
    SESSION_CLEANUP_INTERVAL_MINUTES: 5,
  },
}))

describe('SessionCleanupJob', () => {
  let mockSessionService: ISessionService
  let cleanupJob: SessionCleanupJob

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockSessionService = {
      cleanupExpiredSessions: vi.fn(),
      createSession: vi.fn(),
      getSession: vi.fn(),
      revokeSession: vi.fn(),
      revokeAllUserSessions: vi.fn(),
      refreshSession: vi.fn(),
    }

    cleanupJob = new SessionCleanupJob(mockSessionService)
  })

  afterEach(() => {
    cleanupJob.stop()
    vi.useRealTimers()
  })

  describe('start', () => {
    it('should start the cleanup job', () => {
      // Act
      cleanupJob.start()

      // Assert
      expect(cleanupJob.isJobRunning()).toBe(true)
      expect(logger.logger.info).toHaveBeenCalledWith(
        'Starting session cleanup job',
        expect.any(Object)
      )
    })

    it('should run cleanup immediately on start', async () => {
      // Arrange
      vi.mocked(mockSessionService.cleanupExpiredSessions).mockResolvedValue(5)

      // Act
      cleanupJob.start()
      await vi.runOnlyPendingTimersAsync()

      // Assert
      expect(mockSessionService.cleanupExpiredSessions).toHaveBeenCalled()
    })

    it('should not start if already running', () => {
      // Arrange
      cleanupJob.start()

      // Act
      cleanupJob.start()

      // Assert
      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Session cleanup job is already running'
      )
    })

    it('should schedule cleanup at intervals', async () => {
      // Arrange
      vi.mocked(mockSessionService.cleanupExpiredSessions).mockResolvedValue(0)

      // Act
      cleanupJob.start()
      // Wait for immediate call
      await vi.runOnlyPendingTimersAsync()
      const initialCallCount =
        mockSessionService.cleanupExpiredSessions.mock.calls.length
      // Advance time for interval (5 minutes)
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)

      // Assert
      // Should be called at least once immediately, and at least once more after interval
      const finalCallCount =
        mockSessionService.cleanupExpiredSessions.mock.calls.length
      expect(initialCallCount).toBeGreaterThanOrEqual(1) // Called at least once immediately
      expect(finalCallCount).toBeGreaterThan(initialCallCount) // Called again after interval
    })
  })

  describe('stop', () => {
    it('should stop the cleanup job', () => {
      // Arrange
      cleanupJob.start()

      // Act
      cleanupJob.stop()

      // Assert
      expect(cleanupJob.isJobRunning()).toBe(false)
      expect(logger.logger.info).toHaveBeenCalledWith(
        'Stopping session cleanup job'
      )
    })

    it('should not stop if not running', () => {
      // Act
      cleanupJob.stop()

      // Assert
      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Session cleanup job is not running'
      )
    })

    it('should clear the interval', () => {
      // Arrange
      cleanupJob.start()

      // Act
      cleanupJob.stop()
      vi.advanceTimersByTime(5 * 60 * 1000)

      // Assert
      // Should only be called once (on start), not after stop
      expect(mockSessionService.cleanupExpiredSessions).toHaveBeenCalledTimes(1)
    })
  })

  describe('runCleanup', () => {
    it('should log cleanup results', async () => {
      // Arrange
      vi.mocked(mockSessionService.cleanupExpiredSessions).mockResolvedValue(10)

      // Act
      cleanupJob.start()
      await vi.runOnlyPendingTimersAsync()

      // Assert
      expect(logger.logger.info).toHaveBeenCalledWith(
        'Session cleanup completed',
        { revokedSessions: 10 }
      )
    })

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      const error = new Error('Cleanup failed')
      vi.mocked(mockSessionService.cleanupExpiredSessions).mockRejectedValue(
        error
      )

      // Act
      cleanupJob.start()
      // Wait for immediate call only
      await vi.runOnlyPendingTimersAsync()

      // Assert
      expect(logger.logger.error).toHaveBeenCalledWith(
        'Error during session cleanup',
        error
      )
      // Job should still be running
      expect(cleanupJob.isJobRunning()).toBe(true)
    })
  })

  describe('isJobRunning', () => {
    it('should return false when job is not started', () => {
      // Assert
      expect(cleanupJob.isJobRunning()).toBe(false)
    })

    it('should return true when job is running', () => {
      // Arrange
      cleanupJob.start()

      // Assert
      expect(cleanupJob.isJobRunning()).toBe(true)
    })

    it('should return false after job is stopped', () => {
      // Arrange
      cleanupJob.start()
      cleanupJob.stop()

      // Assert
      expect(cleanupJob.isJobRunning()).toBe(false)
    })
  })
})

