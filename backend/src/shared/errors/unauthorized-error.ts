import { HTTP_STATUS } from '../constants'
import { BaseError } from './base-error'

/**
 * Unauthorized Error
 * Used when authentication is required or has failed
 */
export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, HTTP_STATUS.UNAUTHORIZED, true, details)
    this.name = 'UnauthorizedError'
  }
}
