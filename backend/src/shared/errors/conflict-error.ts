import { HTTP_STATUS } from '../constants';
import { BaseError } from './base-error';

/**
 * Conflict Error
 * Used when the request conflicts with the current state of the resource
 */
export class ConflictError extends BaseError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, HTTP_STATUS.CONFLICT, true, details);
    this.name = 'ConflictError';
  }
}

