import { HTTP_STATUS } from '../constants';
import { BaseError } from './base-error';

/**
 * Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends BaseError {
  constructor(message = 'Internal Server Error', details?: unknown) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, details);
    this.name = 'InternalServerError';
  }
}

