import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import { ENV, isDevelopment, HTTP_STATUS } from '../constants'
import { logger } from '../util'
import { ResponseUtil } from '../util'

/**
 * Rate Limiting Constants
 */
const RATE_LIMIT_DEFAULTS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes in milliseconds
  MAX_REQUESTS: 100, // Maximum requests per window
} as const

/**
 * General Rate Limiter
 * Applied globally to all API routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || RATE_LIMIT_DEFAULTS.WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS || RATE_LIMIT_DEFAULTS.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address as the key
  keyGenerator: (req: Request): string => {
    // Try to get real IP from proxy headers (for production behind reverse proxy)
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    // Use Express's req.ip which handles proxy headers automatically
    // Fallback to connection remoteAddress if req.ip is not available
    return req.ip || (req.connection?.remoteAddress as string) || 'unknown'
  },
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    const ip = req.ip || (req.connection?.remoteAddress as string) || 'unknown'
    logger.warn('Rate limit exceeded', {
      ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent'),
    })

    ResponseUtil.error(
      res,
      'Too many requests from this IP, please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    )
  },
  // Skip rate limiting in development if SKIP_RATE_LIMIT is set
  skip: () => isDevelopment() && ENV.SKIP_RATE_LIMIT,
})
