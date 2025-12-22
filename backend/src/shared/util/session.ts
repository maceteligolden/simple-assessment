import crypto from 'crypto'
import { logger } from './logger'

/**
 * Session Utility Functions
 * Helper functions for session management
 */

/**
 * Generate a secure random session token
 * @returns string - Secure random token
 */
export function generateSessionToken(): string {
  try {
    const token = crypto.randomBytes(32).toString('hex')
    logger.debug('Session token generated')
    return token
  } catch (error) {
    logger.error('Error generating session token', error)
    throw new Error('Failed to generate session token')
  }
}

/**
 * Calculate session expiration date
 * @param durationInMinutes - Session duration in minutes
 * @returns Date - Expiration date
 */
export function calculateSessionExpiration(durationInMinutes: number): Date {
  const expiration = new Date()
  expiration.setMinutes(expiration.getMinutes() + durationInMinutes)
  return expiration
}

/**
 * Check if a session is expired
 * @param expiresAt - Session expiration date
 * @returns boolean - True if expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt
}

/**
 * Extract IP address from request
 * @param req - Express request object
 * @returns string - IP address
 */
export function extractIpAddress(req: {
  ip?: string
  headers?: Record<string, unknown>
}): string {
  // Check for forwarded IP (from proxy/load balancer)
  const forwardedFor =
    req.headers?.['x-forwarded-for'] || req.headers?.['X-Forwarded-For']
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor)
      ? String(forwardedFor[0])
      : String(forwardedFor).split(',')[0]
    return ips.trim()
  }

  // Check for real IP header
  const realIp = req.headers?.['x-real-ip'] || req.headers?.['X-Real-IP']
  if (realIp) {
    return Array.isArray(realIp) ? String(realIp[0]) : String(realIp)
  }

  // Fallback to req.ip or default
  return req.ip || 'unknown'
}

/**
 * Extract user agent from request
 * @param req - Express request object
 * @returns string - User agent
 */
export function extractUserAgent(req: {
  get?: (name: string) => string | undefined
  headers?: Record<string, unknown>
}): string {
  if (req.get) {
    return req.get('user-agent') || 'unknown'
  }
  const ua = req.headers?.['user-agent'] || req.headers?.['User-Agent']
  if (!ua) return 'unknown'
  return Array.isArray(ua) ? String(ua[0]) : String(ua)
}
