import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors';
import { HTTP_STATUS, isDevelopment } from '../constants';
import { logger } from '../util';

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
    return next(err);
  }

  // Log the error
  logger.error('Error occurred', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Handle BaseError instances
  if (err instanceof BaseError) {
    const response: {
      success: boolean;
      error: {
        message: string;
        statusCode: number;
        details?: unknown;
      };
    } = {
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    };

    // Include details in development or if explicitly provided
    if (isDevelopment() && err.details) {
      response.error.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown errors
  const response: {
    success: boolean;
    error: {
      message: string;
      statusCode: number;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    },
  };

  // Include stack trace in development
  if (isDevelopment() && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};

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
  });

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: HTTP_STATUS.NOT_FOUND,
    },
  });
};

