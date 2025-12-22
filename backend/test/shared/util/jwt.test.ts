import { describe, it, expect } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  generateToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
  extractTokenFromHeader,
} from '../../../src/shared/util/jwt'
import { UserRole } from '../../../src/shared/constants/user-roles'

describe('JWT Utility', () => {
  const mockPayload = {
    userId: 'user-id-123',
    email: 'test@example.com',
    role: 'participant' as UserRole,
  }

  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      // Act
      const token = generateAccessToken(mockPayload)

      // Assert
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different payloads', () => {
      // Arrange
      const payload1 = { ...mockPayload, userId: 'user-1' }
      const payload2 = { ...mockPayload, userId: 'user-2' }

      // Act
      const token1 = generateAccessToken(payload1)
      const token2 = generateAccessToken(payload2)

      // Assert
      expect(token1).not.toBe(token2)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      // Act
      const token = generateRefreshToken(mockPayload)

      // Assert
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens than access tokens', () => {
      // Act
      const accessToken = generateAccessToken(mockPayload)
      const refreshToken = generateRefreshToken(mockPayload)

      // Assert
      expect(accessToken).not.toBe(refreshToken)
    })
  })

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      // Act
      const tokens = generateTokens(mockPayload)

      // Assert
      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.accessToken).not.toBe(tokens.refreshToken)
    })

    it('should generate valid tokens that can be verified', () => {
      // Act
      const tokens = generateTokens(mockPayload)
      const decodedAccess = verifyAccessToken(tokens.accessToken)
      const decodedRefresh = verifyRefreshToken(tokens.refreshToken)

      // Assert
      expect(decodedAccess.userId).toBe(mockPayload.userId)
      expect(decodedRefresh.userId).toBe(mockPayload.userId)
    })
  })

  describe('generateToken (legacy)', () => {
    it('should generate an access token (backward compatibility)', () => {
      // Act
      const token = generateToken(mockPayload)

      // Assert
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      // Should be same as generateAccessToken
      const accessToken = generateAccessToken(mockPayload)
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      // Arrange
      const token = generateAccessToken(mockPayload)

      // Act
      const decoded = verifyAccessToken(token)

      // Assert
      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.role).toBe(mockPayload.role)
    })

    it('should throw error for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.token.here'

      // Act & Assert
      expect(() => verifyAccessToken(invalidToken)).toThrow()
    })

    it('should throw error for empty token', () => {
      // Act & Assert
      expect(() => verifyAccessToken('')).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      // Arrange
      const token = generateRefreshToken(mockPayload)

      // Act
      const decoded = verifyRefreshToken(token)

      // Assert
      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.role).toBe(mockPayload.role)
    })

    it('should throw error for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.token.here'

      // Act & Assert
      expect(() => verifyRefreshToken(invalidToken)).toThrow()
    })

    it('should not verify access token as refresh token', () => {
      // Arrange
      const accessToken = generateAccessToken(mockPayload)

      // Act & Assert
      expect(() => verifyRefreshToken(accessToken)).toThrow()
    })
  })

  describe('verifyToken (legacy)', () => {
    it('should verify access token (backward compatibility)', () => {
      // Arrange
      const token = generateAccessToken(mockPayload)

      // Act
      const decoded = verifyToken(token)

      // Assert
      expect(decoded.userId).toBe(mockPayload.userId)
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      // Arrange
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

      // Act
      const token = extractTokenFromHeader(authHeader)

      // Assert
      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
    })

    it('should return null for undefined header', () => {
      // Act
      const token = extractTokenFromHeader(undefined)

      // Assert
      expect(token).toBeNull()
    })

    it('should return null for empty header', () => {
      // Act
      const token = extractTokenFromHeader('')

      // Assert
      expect(token).toBeNull()
    })

    it('should return null for header without Bearer prefix', () => {
      // Arrange
      const authHeader = 'Token some-token'

      // Act
      const token = extractTokenFromHeader(authHeader)

      // Assert
      expect(token).toBeNull()
    })

    it('should return null for header with only Bearer', () => {
      // Arrange
      const authHeader = 'Bearer'

      // Act
      const token = extractTokenFromHeader(authHeader)

      // Assert
      expect(token).toBeNull()
    })

    it('should return null for malformed header', () => {
      // Arrange
      const authHeader = 'Bearer token1 token2'

      // Act
      const token = extractTokenFromHeader(authHeader)

      // Assert
      expect(token).toBeNull()
    })

    it('should handle lowercase bearer prefix', () => {
      // Arrange
      const authHeader = 'bearer some-token'

      // Act
      const token = extractTokenFromHeader(authHeader)

      // Assert
      expect(token).toBeNull() // Should be case-sensitive
    })
  })
})
