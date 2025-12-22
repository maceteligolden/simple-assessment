import jwt, { SignOptions } from 'jsonwebtoken'
import { ENV, UserRole } from '../constants'
import { logger } from './logger'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

/**
 * Generate an access token (short-lived)
 * @param payload - Token payload (userId, email, role)
 * @returns string - JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  try {
    if (!ENV.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    } as SignOptions)

    logger.debug('Access token generated', {
      userId: payload.userId,
      role: payload.role,
    })
    return token
  } catch (error) {
    logger.error('Error generating access token', error)
    throw new Error('Failed to generate access token')
  }
}

/**
 * Generate a refresh token (long-lived)
 * @param payload - Token payload (userId, email, role)
 * @returns string - JWT refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  try {
    if (!ENV.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not configured')
    }

    const token = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions)

    logger.debug('Refresh token generated', {
      userId: payload.userId,
      role: payload.role,
    })
    return token
  } catch (error) {
    logger.error('Error generating refresh token', error)
    throw new Error('Failed to generate refresh token')
  }
}

/**
 * Generate both access and refresh tokens
 * @param payload - Token payload (userId, email, role)
 * @returns Object with accessToken and refreshToken
 */
export function generateTokens(payload: JWTPayload): {
  accessToken: string
  refreshToken: string
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateAccessToken instead
 */
export function generateToken(payload: JWTPayload): string {
  return generateAccessToken(payload)
}

/**
 * Verify an access token
 * @param token - JWT access token to verify
 * @returns JWTPayload - Decoded token payload
 * @throws Error if token is invalid
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    if (!ENV.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JWTPayload
    logger.debug('Access token verified', {
      userId: decoded.userId,
      role: decoded.role,
    })
    return decoded
  } catch (error) {
    logger.error('Error verifying access token', error)
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token')
    }
    throw new Error('Failed to verify access token')
  }
}

/**
 * Verify a refresh token
 * @param token - JWT refresh token to verify
 * @returns JWTPayload - Decoded token payload
 * @throws Error if token is invalid
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    if (!ENV.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not configured')
    }

    const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as JWTPayload
    logger.debug('Refresh token verified', {
      userId: decoded.userId,
      role: decoded.role,
    })
    return decoded
  } catch (error) {
    logger.error('Error verifying refresh token', error)
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token')
    }
    throw new Error('Failed to verify refresh token')
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use verifyAccessToken instead
 */
export function verifyToken(token: string): JWTPayload {
  return verifyAccessToken(token)
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns string | null - Token or null if not found
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}
