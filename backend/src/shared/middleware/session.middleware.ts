import { Request, Response, NextFunction } from 'express'
import { logger } from '../util/logger'
import { ResponseUtil } from '../util/response'
import { HTTP_STATUS } from '../constants'
import { ISessionService } from '../service/session.service'
import { extractIpAddress, extractUserAgent } from '../util/session'
import {
  verifyAccessToken,
  extractTokenFromHeader,
  JWTPayload,
} from '../util/jwt'

/**
 * Extend Express Request to include session information
 * Note: user is required after authenticate middleware runs
 */
declare global {
  namespace Express {
    interface Request {
      user: JWTPayload
      session?: {
        id: string
        userId: string
        sessionToken: string
        expiresAt: Date
        lastActivity: Date
      }
    }
  }
}

/**
 * Session Authentication Middleware
 * Verifies session token and attaches session information to request
 * Falls back to JWT token verification if session token is not provided
 */
export function sessionAuth(sessionService: ISessionService) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

      // Try to verify as session token first
      try {
        const session = await sessionService.getSessionByToken(token)

        // Update session activity
        await sessionService.updateSessionActivity(session._id.toString())

        // Attach session to request
        req.session = {
          id: session._id.toString(),
          userId: session.userId.toString(),
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt,
          lastActivity: session.lastActivity,
        }

        // Attach user info from session (we'll need to fetch user details if needed)
        // For now, we'll use the userId from session
        req.user = {
          userId: session.userId.toString(),
          email: '', // Will be populated if needed
          role: 'examiner' as const, // Will be populated if needed
        }

        logger.debug('Session authentication successful', {
          sessionId: session._id.toString(),
          userId: session.userId.toString(),
          path: req.path,
        })

        next()
        return
      } catch (sessionError) {
        // If session verification fails, try JWT token as fallback
        logger.debug('Session token verification failed, trying JWT token', {
          error:
            sessionError instanceof Error
              ? sessionError.message
              : 'Unknown error',
        })
      }

      // Fallback to JWT token verification
      try {
        const decoded = verifyAccessToken(token)
        req.user = decoded

        logger.debug('JWT authentication successful (fallback)', {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          path: req.path,
        })

        next()
      } catch (jwtError) {
        const errorMessage =
          jwtError instanceof Error ? jwtError.message : 'Invalid token'
        logger.warn('Authentication failed', {
          error: errorMessage,
          path: req.path,
          method: req.method,
          ip: req.ip,
        })

        ResponseUtil.error(res, errorMessage, HTTP_STATUS.UNAUTHORIZED)
      }
    } catch (error) {
      logger.error('Unexpected error in session authentication', error)
      ResponseUtil.error(
        res,
        'Authentication failed',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }
}

/**
 * Optional Session Middleware
 * Attempts to authenticate via session but doesn't fail if no session exists
 * Useful for routes that work with or without authentication
 */
export function optionalSessionAuth(sessionService: ISessionService) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization
      const token = extractTokenFromHeader(authHeader)

      if (!token) {
        // No token provided, continue without authentication
        next()
        return
      }

      // Try session authentication
      try {
        const session = await sessionService.getSessionByToken(token)
        await sessionService.updateSessionActivity(session._id.toString())

        req.session = {
          id: session._id.toString(),
          userId: session.userId.toString(),
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt,
          lastActivity: session.lastActivity,
        }

        req.user = {
          userId: session.userId.toString(),
          email: '',
          role: 'examiner' as const,
        }

        logger.debug('Optional session authentication successful', {
          sessionId: session._id.toString(),
        })
      } catch (sessionError) {
        // Try JWT as fallback
        try {
          const decoded = verifyAccessToken(token)
          req.user = decoded
          logger.debug('Optional JWT authentication successful', {
            userId: decoded.userId,
          })
        } catch (jwtError) {
          // Both failed, but continue without authentication
          logger.debug(
            'Optional authentication failed, continuing without auth'
          )
        }
      }

      next()
    } catch (error) {
      logger.error('Unexpected error in optional session authentication', error)
      // Continue without authentication on error
      next()
    }
  }
}
