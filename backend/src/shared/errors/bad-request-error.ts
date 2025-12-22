import { HTTP_STATUS } from '../constants'
import { BaseError } from './base-error'

/**
 * Bad Request Error
 * Used when the request is malformed or invalid
 */
export class BadRequestError extends BaseError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, true, details)
    this.name = 'BadRequestError'
  }
}
