/**
 * Pagination Base Interface
 * Services that require pagination should extend this interface
 */

import { PaginationParams } from '../util/pagination'

/**
 * Base interface for service inputs that require pagination
 * Services should extend this and add their specific fields
 */
export interface PaginationInput {
  pagination: PaginationParams
}

