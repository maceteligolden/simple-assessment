import { HTTP_STATUS } from '../constants'
import { BaseError } from './base-error'

/**
 * Optimistic Lock Error
 * Thrown when a document version mismatch is detected during update
 * Indicates the document was modified by another operation
 */
export class OptimisticLockError extends BaseError {
  public readonly currentVersion: number
  public readonly expectedVersion: number

  constructor(
    message = 'Document was modified by another operation. Please refresh and try again.',
    currentVersion: number,
    expectedVersion: number,
    details?: unknown
  ) {
    super(message, HTTP_STATUS.CONFLICT, true, {
      ...details,
      currentVersion,
      expectedVersion,
      errorType: 'OptimisticLockError',
    })
    this.name = 'OptimisticLockError'
    this.currentVersion = currentVersion
    this.expectedVersion = expectedVersion
  }
}

