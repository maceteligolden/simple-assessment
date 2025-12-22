import { HTTP_STATUS } from '../constants'
import { BaseError } from './base-error'

/**
 * Unprocessable Entity Error
 * Used when the request is well-formed but contains semantic errors
 */
export class UnprocessableEntityError extends BaseError {
  constructor(message = 'Unprocessable Entity', details?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, true, details)
    this.name = 'UnprocessableEntityError'
  }
}
