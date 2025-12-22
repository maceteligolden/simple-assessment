import { Response } from 'express'
import { ApiResponse, ResponseOutput } from '../interfaces'
import { HTTP_STATUS } from '../constants'

/**
 * Standardized Response Utility
 * Provides consistent API response structure across the application
 */
export class ResponseUtil {
  /**
   * Send a successful response
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = HTTP_STATUS.OK,
    meta?: Record<string, unknown>
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    }

    return res.status(statusCode).json(response)
  }

  /**
   * Send a created response (201)
   */
  static created<T>(
    res: Response,
    data: T,
    meta?: Record<string, unknown>
  ): Response {
    return this.success(res, data, HTTP_STATUS.CREATED, meta)
  }

  /**
   * Send a no content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(HTTP_STATUS.NO_CONTENT).send()
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: unknown
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        statusCode,
        ...(details && typeof details === 'object' ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return res.status(statusCode).json(response)
  }

  /**
   * Send a bad request response (400)
   */
  static badRequest(
    res: Response,
    message: string = 'Bad Request',
    details?: unknown
  ): Response {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, details)
  }

  /**
   * Send an unauthorized response (401)
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED)
  }

  /**
   * Send a forbidden response (403)
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN)
  }

  /**
   * Send a not found response (404)
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND)
  }

  /**
   * Send a conflict response (409)
   */
  static conflict(
    res: Response,
    message: string = 'Conflict',
    details?: unknown
  ): Response {
    return this.error(res, message, HTTP_STATUS.CONFLICT, details)
  }

  /**
   * Send an unprocessable entity response (422)
   */
  static unprocessableEntity(
    res: Response,
    message: string = 'Unprocessable Entity',
    details?: unknown
  ): Response {
    return this.error(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details)
  }

  /**
   * Send a paginated response
   * Frontend expects pagination in meta field
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    meta?: Record<string, unknown>
  ): Response {
    const totalPages = Math.ceil(total / limit)
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        ...meta,
      },
    }

    return res.status(HTTP_STATUS.OK).json(response)
  }

  /**
   * Helper to send response from ResponseOutput
   */
  static send<T>(res: Response, output: ResponseOutput<T>): Response {
    return this.success(
      res,
      output.data,
      output.statusCode || HTTP_STATUS.OK,
      output.meta
    )
  }
}
