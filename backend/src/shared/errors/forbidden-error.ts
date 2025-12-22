import { HTTP_STATUS } from '../constants'
import { BaseError } from './base-error'

/**
 * Forbidden Error
 * Used when the user doesn't have permission to access the resource
 */
export class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, HTTP_STATUS.FORBIDDEN, true, details)
    this.name = 'ForbiddenError'
  }
}
