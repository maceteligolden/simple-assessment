import { Request, Response, NextFunction } from 'express'
import { logger } from '../util/logger'
import {
  verifyAccessToken,
  extractTokenFromHeader,
  JWTPayload,
} from '../util/jwt'
import { ResponseUtil } from '../util/response'
import { HTTP_STATUS } from '../constants'

/**
 * Extend Express Request to include user information
 * Note: user is required after authenticate middleware runs
 */
declare global {
  namespace Express {
    interface Request {
      user: JWTPayload
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      })
      ResponseUtil.error(
        res,
        'Authentication required. Please provide a valid token.',
        HTTP_STATUS.UNAUTHORIZED
      )
      return
    }

    const decoded = verifyAccessToken(token)
    req.user = decoded

    logger.debug('Authentication successful', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      path: req.path,
    })

    next()
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Invalid token'
    logger.warn('Authentication failed', {
      error: errorMessage,
      path: req.path,
      method: req.method,
      ip: req.ip,
    })

    ResponseUtil.error(res, errorMessage, HTTP_STATUS.UNAUTHORIZED)
  }
}
