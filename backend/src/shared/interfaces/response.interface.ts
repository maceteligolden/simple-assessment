/**
 * Standard API Response Structure
 * All API responses follow this structure for consistency
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    statusCode: number
    details?: unknown
  }
  meta?: {
    timestamp: string
    path?: string
    [key: string]: unknown
  }
}

/**
 * Base Input/Output interfaces for request/response typing
 */
export interface ResponseInput<T = unknown> {
  body?: T
  params?: Record<string, string>
  query?: Record<string, string | string[]>
  user?: {
    id: string
    email: string
    role?: string
    [key: string]: unknown
  }
}

export interface ResponseOutput<T = unknown> {
  data: T
  statusCode?: number
  meta?: Record<string, unknown>
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Paginated response output
 */
export interface PaginatedResponseOutput<T = unknown> extends ResponseOutput<
  T[]
> {
  pagination: PaginationMeta
  meta?: Record<string, unknown>
}
