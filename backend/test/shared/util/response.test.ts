import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Response } from 'express'
import { ResponseUtil } from '../../../src/shared/util/response'
import { HTTP_STATUS } from '../../../src/shared/constants/http-status-codes'
import { ResponseOutput } from '../../../src/shared/interfaces/response.interface'

// Mock Express Response
const createMockResponse = (): Response => {
  const res = {} as Response
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  return res
}

describe('ResponseUtil', () => {
  let mockRes: Response

  beforeEach(() => {
    mockRes = createMockResponse()
    vi.clearAllMocks()
  })

  describe('success', () => {
    it('should send a successful response with default status code', () => {
      // Arrange
      const data = { message: 'Success' }

      // Act
      ResponseUtil.success(mockRes, data)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should send a successful response with custom status code', () => {
      // Arrange
      const data = { message: 'Success' }
      const statusCode = HTTP_STATUS.ACCEPTED

      // Act
      ResponseUtil.success(mockRes, data, statusCode)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(statusCode)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should include custom meta data', () => {
      // Arrange
      const data = { message: 'Success' }
      const meta = { requestId: '123', version: '1.0' }

      // Act
      ResponseUtil.success(mockRes, data, HTTP_STATUS.OK, meta)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
          ...meta,
        },
      })
    })
  })

  describe('created', () => {
    it('should send a created response with 201 status', () => {
      // Arrange
      const data = { id: '123', name: 'Created Resource' }

      // Act
      ResponseUtil.created(mockRes, data)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should include custom meta data', () => {
      // Arrange
      const data = { id: '123' }
      const meta = { location: '/api/resource/123' }

      // Act
      ResponseUtil.created(mockRes, data, meta)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
          ...meta,
        },
      })
    })
  })

  describe('noContent', () => {
    it('should send a no content response with 204 status', () => {
      // Act
      ResponseUtil.noContent(mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT)
      expect(mockRes.send).toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
    })
  })

  describe('error', () => {
    it('should send an error response with default status code', () => {
      // Arrange
      const message = 'An error occurred'

      // Act
      ResponseUtil.error(mockRes, message)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should send an error response with custom status code', () => {
      // Arrange
      const message = 'Bad Request'
      const statusCode = HTTP_STATUS.BAD_REQUEST

      // Act
      ResponseUtil.error(mockRes, message, statusCode)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(statusCode)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          statusCode,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should include error details when provided', () => {
      // Arrange
      const message = 'Validation failed'
      const details = { field: 'email', reason: 'Invalid format' }

      // Act
      ResponseUtil.error(mockRes, message, HTTP_STATUS.BAD_REQUEST, details)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
          details,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should not include details when details is not an object', () => {
      // Arrange
      const message = 'Error'
      const details = 'string details'

      // Act
      ResponseUtil.error(mockRes, message, HTTP_STATUS.BAD_REQUEST, details)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('badRequest', () => {
    it('should send a bad request response with default message', () => {
      // Act
      ResponseUtil.badRequest(mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Bad Request',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should send a bad request response with custom message', () => {
      // Arrange
      const message = 'Invalid input parameters'

      // Act
      ResponseUtil.badRequest(mockRes, message)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('unauthorized', () => {
    it('should send an unauthorized response with default message', () => {
      // Act
      ResponseUtil.unauthorized(mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized',
          statusCode: HTTP_STATUS.UNAUTHORIZED,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('forbidden', () => {
    it('should send a forbidden response with default message', () => {
      // Act
      ResponseUtil.forbidden(mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Forbidden',
          statusCode: HTTP_STATUS.FORBIDDEN,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('notFound', () => {
    it('should send a not found response with default message', () => {
      // Act
      ResponseUtil.notFound(mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Resource not found',
          statusCode: HTTP_STATUS.NOT_FOUND,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('conflict', () => {
    it('should send a conflict response with default message', () => {
      // Act
      ResponseUtil.conflict(mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Conflict',
          statusCode: HTTP_STATUS.CONFLICT,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('unprocessableEntity', () => {
    it('should send an unprocessable entity response', () => {
      // Act
      ResponseUtil.unprocessableEntity(mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.UNPROCESSABLE_ENTITY
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unprocessable Entity',
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        },
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('paginated', () => {
    it('should send a paginated response', () => {
      // Arrange
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const page = 1
      const limit = 10
      const total = 25

      // Act
      ResponseUtil.paginated(mockRes, data, page, limit, total)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: false,
          },
        },
      })
    })

    it('should calculate pagination metadata correctly for last page', () => {
      // Arrange
      const data = [{ id: 21 }, { id: 22 }]
      const page = 3
      const limit = 10
      const total = 22

      // Act
      ResponseUtil.paginated(mockRes, data, page, limit, total)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
          pagination: {
            page: 3,
            limit: 10,
            total: 22,
            totalPages: 3,
            hasNext: false,
            hasPrev: true,
          },
        },
      })
    })

    it('should include custom meta data', () => {
      // Arrange
      const data = [{ id: 1 }]
      const meta = { search: 'test' }

      // Act
      ResponseUtil.paginated(mockRes, data, 1, 10, 1, meta)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
          ...meta,
        },
      })
    })
  })

  describe('send', () => {
    it('should send response from ResponseOutput', () => {
      // Arrange
      const output: ResponseOutput<{ id: string }> = {
        data: { id: '123' },
        statusCode: HTTP_STATUS.CREATED,
        meta: { location: '/api/resource/123' },
      }

      // Act
      ResponseUtil.send(mockRes, output)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: output.data,
        meta: {
          timestamp: expect.any(String),
          ...output.meta,
        },
      })
    })

    it('should use default status code when not provided', () => {
      // Arrange
      const output: ResponseOutput<{ id: string }> = {
        data: { id: '123' },
      }

      // Act
      ResponseUtil.send(mockRes, output)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
    })
  })
})

