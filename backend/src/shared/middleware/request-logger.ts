import { Request, Response, NextFunction } from 'express';
import { logger } from '../util';

/**
 * Request Logger Middleware
 * Logs incoming HTTP requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  logger.http(`Incoming ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    query: req.query,
    params: req.params,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(`Outgoing ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

