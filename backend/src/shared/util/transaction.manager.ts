import mongoose from 'mongoose'
import { ClientSession } from 'mongoose'
import { logger } from './logger'

/**
 * Transaction Manager
 * Handles MongoDB transaction session lifecycle
 * Provides utilities for executing operations within transactions
 */
export class TransactionManager {
  /**
   * Execute a function within a transaction
   * Automatically handles commit/rollback and session cleanup
   *
   * @param operation - Function to execute within transaction (receives session)
   * @param options - Optional transaction configuration
   * @returns Result of the operation
   * @throws Error if transaction fails (automatically rolls back)
   *
   * @example
   * ```typescript
   * const result = await TransactionManager.withTransaction(async (session) => {
   *   const attempt = await attemptRepo.create(data, { session })
   *   await participantRepo.markAsUsed(id, { session })
   *   return attempt
   * })
   * ```
   */
  static async withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    options?: {
      timeout?: number // Transaction timeout in milliseconds (default: 60s)
    }
  ): Promise<T> {
    const session = await mongoose.startSession()

    try {
      // Configure transaction timeout if provided
      if (options?.timeout) {
        session.startTransaction({
          maxTimeMS: options.timeout,
        })
      } else {
        session.startTransaction()
      }

      logger.debug('Transaction started')

      // Execute the operation with the session
      const result = await operation(session)

      // Commit the transaction
      await session.commitTransaction()
      logger.debug('Transaction committed successfully')

      return result
    } catch (error) {
      // Abort transaction on any error
      await session.abortTransaction()
      logger.warn('Transaction aborted due to error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    } finally {
      // Always end the session to free resources
      session.endSession()
      logger.debug('Transaction session ended')
    }
  }

  /**
   * Create a session for manual transaction management
   * Use this when you need more control over transaction lifecycle
   *
   * @returns MongoDB client session
   *
   * @example
   * ```typescript
   * const session = await TransactionManager.createSession()
   * try {
   *   session.startTransaction()
   *   await repo.create(data, { session })
   *   await session.commitTransaction()
   * } catch (error) {
   *   await session.abortTransaction()
   *   throw error
   * } finally {
   *   session.endSession()
   * }
   * ```
   */
  static async createSession(): Promise<ClientSession> {
    return await mongoose.startSession()
  }

  /**
   * Start a transaction on an existing session
   *
   * @param session - MongoDB client session
   * @param options - Optional transaction options
   */
  static startTransaction(
    session: ClientSession,
    options?: { maxTimeMS?: number }
  ): void {
    if (options?.maxTimeMS) {
      session.startTransaction({ maxTimeMS: options.maxTimeMS })
    } else {
      session.startTransaction()
    }
    logger.debug('Transaction started on session')
  }

  /**
   * Commit a transaction
   *
   * @param session - MongoDB client session
   */
  static async commitTransaction(session: ClientSession): Promise<void> {
    await session.commitTransaction()
    logger.debug('Transaction committed')
  }

  /**
   * Abort a transaction
   *
   * @param session - MongoDB client session
   */
  static async abortTransaction(session: ClientSession): Promise<void> {
    await session.abortTransaction()
    logger.debug('Transaction aborted')
  }

  /**
   * End a session
   *
   * @param session - MongoDB client session
   */
  static endSession(session: ClientSession): void {
    session.endSession()
    logger.debug('Session ended')
  }
}

