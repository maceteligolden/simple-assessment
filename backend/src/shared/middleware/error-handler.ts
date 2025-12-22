import { Request, Response, NextFunction } from 'express'
import { BaseError } from '../errors'
import { HTTP_STATUS, isDevelopment } from '../constants'
import { logger, ResponseUtil } from '../util'

/**
 * Global Error Handler Middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  err: Error | BaseError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err)
  }

  // Log the error
  logger.error('Error occurred', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })

  // Handle BaseError instances
  if (err instanceof BaseError) {
    const details = isDevelopment() && err.details ? err.details : undefined
    ResponseUtil.error(res, err.message, err.statusCode, details)
    return
  }

  // Handle unknown errors
  const details =
    isDevelopment() && err.stack ? { stack: err.stack } : undefined
  ResponseUtil.error(
    res,
    err.message || 'Internal Server Error',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details
  )
}

/**
 * 404 Not Found Handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })

  ResponseUtil.notFound(res, `Route ${req.method} ${req.path} not found`)
}
