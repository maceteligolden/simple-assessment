/**
 * Pagination Utility
 * Provides reusable pagination logic for parsing query parameters and paginating arrays
 */

/**
 * Pagination Input Interface
 * Query parameters from request
 */
export interface PaginationInput {
  page?: string
  limit?: string
}

/**
 * Pagination Parameters
 * Parsed and validated pagination values
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Pagination Metadata
 * Calculated pagination information
 */
export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Paginated Result
 * Result with paginated data and metadata
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationMetadata
}

/**
 * Parse pagination parameters from query string
 * @param query - Query parameters with optional page and limit
 * @param defaultPage - Default page number (default: 1)
 * @param defaultLimit - Default limit per page (default: 10)
 * @returns Parsed pagination parameters
 */
export function parsePaginationParams(
  query?: PaginationInput,
  defaultPage: number = 1,
  defaultLimit: number = 10
): PaginationParams {
  const page = query?.page
    ? Math.max(1, parseInt(query.page, 10) || defaultPage)
    : defaultPage

  const limit = query?.limit
    ? Math.max(1, parseInt(query.limit, 10) || defaultLimit)
    : defaultLimit

  return { page, limit }
}

/**
 * Paginate an array of items
 * @param array - Array to paginate
 * @param params - Pagination parameters
 * @returns Paginated result with data and metadata
 */
export function paginateArray<T>(
  array: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const { page, limit } = params
  const total = array.length
  const totalPages = Math.ceil(total / limit)
  const skip = (page - 1) * limit
  const paginatedData = array.slice(skip, skip + limit)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Create pagination metadata from total count and params
 * Useful when pagination is done at database level
 * @param total - Total number of items
 * @param params - Pagination parameters
 * @returns Pagination metadata
 */
export function createPaginationMetadata(
  total: number,
  params: PaginationParams
): PaginationMetadata {
  const { page, limit } = params
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

