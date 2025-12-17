import { HTTP_STATUS } from '../constants';
import { BaseError } from './base-error';

/**
 * Not Found Error
 * Used when a requested resource is not found
 */
export class NotFoundError extends BaseError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, HTTP_STATUS.NOT_FOUND, true, details);
    this.name = 'NotFoundError';
  }
}

