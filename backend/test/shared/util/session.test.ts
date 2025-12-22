import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateSessionToken,
  calculateSessionExpiration,
  isSessionExpired,
  extractIpAddress,
  extractUserAgent,
} from '../../../src/shared/util/session'
import * as logger from '../../../src/shared/util/logger'

// Mock logger
vi.mock('../../../src/shared/util/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Session Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateSessionToken', () => {
    it('should generate a secure random token', () => {
      // Act
      const token1 = generateSessionToken()
      const token2 = generateSessionToken()

      // Assert
      expect(token1).toBeDefined()
      expect(typeof token1).toBe('string')
      expect(token1.length).toBe(64) // 32 bytes = 64 hex characters
      expect(token1).not.toBe(token2) // Should be unique
      expect(logger.logger.debug).toHaveBeenCalledWith(
        'Session token generated'
      )
    })

    it('should generate different tokens each time', () => {
      // Act
      const tokens = Array.from({ length: 10 }, () => generateSessionToken())

      // Assert
      const uniqueTokens = new Set(tokens)
      expect(uniqueTokens.size).toBe(10) // All tokens should be unique
    })
  })

  describe('calculateSessionExpiration', () => {
    it('should calculate expiration date correctly', () => {
      // Arrange
      const durationInMinutes = 30
      const now = new Date()
      const expectedExpiration = new Date(now)
      expectedExpiration.setMinutes(expectedExpiration.getMinutes() + 30)

      // Act
      const expiration = calculateSessionExpiration(durationInMinutes)

      // Assert
      expect(expiration).toBeInstanceOf(Date)
      // Allow 1 second difference for execution time
      const timeDiff = Math.abs(
        expiration.getTime() - expectedExpiration.getTime()
      )
      expect(timeDiff).toBeLessThan(1000)
    })

    it('should handle zero duration', () => {
      // Arrange
      const durationInMinutes = 0
      const now = new Date()

      // Act
      const expiration = calculateSessionExpiration(durationInMinutes)

      // Assert
      const timeDiff = Math.abs(expiration.getTime() - now.getTime())
      expect(timeDiff).toBeLessThan(1000)
    })

    it('should handle negative duration', () => {
      // Arrange
      const durationInMinutes = -10
      const now = new Date()

      // Act
      const expiration = calculateSessionExpiration(durationInMinutes)

      // Assert
      expect(expiration.getTime()).toBeLessThan(now.getTime())
    })
  })

  describe('isSessionExpired', () => {
    it('should return true for expired session', () => {
      // Arrange
      const pastDate = new Date()
      pastDate.setMinutes(pastDate.getMinutes() - 10)

      // Act
      const result = isSessionExpired(pastDate)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for future expiration date', () => {
      // Arrange
      const futureDate = new Date()
      futureDate.setMinutes(futureDate.getMinutes() + 10)

      // Act
      const result = isSessionExpired(futureDate)

      // Assert
      expect(result).toBe(false)
    })

    it('should return true for current date (edge case)', () => {
      // Arrange
      const now = new Date()

      // Act
      const result = isSessionExpired(now)

      // Assert
      expect(result).toBe(true) // Current time is considered expired
    })
  })

  describe('extractIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      // Arrange
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from X-Forwarded-For header (capitalized)', () => {
      // Arrange
      const req = {
        headers: {
          'X-Forwarded-For': '203.0.113.1',
        },
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('203.0.113.1')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', () => {
      // Arrange
      const req = {
        headers: {
          'x-real-ip': '192.168.1.100',
        },
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('192.168.1.100')
    })

    it('should extract IP from X-Real-IP header (capitalized)', () => {
      // Arrange
      const req = {
        headers: {
          'X-Real-IP': '10.0.0.50',
        },
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('10.0.0.50')
    })

    it('should use req.ip as fallback', () => {
      // Arrange
      const req = {
        ip: '127.0.0.1',
        headers: {},
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('127.0.0.1')
    })

    it('should return "unknown" when no IP is available', () => {
      // Arrange
      const req = {
        headers: {},
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('unknown')
    })

    it('should handle array values in x-forwarded-for', () => {
      // Arrange
      const req = {
        headers: {
          'x-forwarded-for': ['192.168.1.1', '10.0.0.1'],
        },
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('192.168.1.1')
    })

    it('should handle array values in x-real-ip', () => {
      // Arrange
      const req = {
        headers: {
          'x-real-ip': ['192.168.1.50'],
        },
      }

      // Act
      const ip = extractIpAddress(req)

      // Assert
      expect(ip).toBe('192.168.1.50')
    })
  })

  describe('extractUserAgent', () => {
    it('should extract user agent using req.get method', () => {
      // Arrange
      const req = {
        get: vi.fn((name: string) => {
          if (name === 'user-agent') return 'Mozilla/5.0'
          return undefined
        }),
      }

      // Act
      const ua = extractUserAgent(req)

      // Assert
      expect(ua).toBe('Mozilla/5.0')
      expect(req.get).toHaveBeenCalledWith('user-agent')
    })

    it('should extract user agent from headers when get is not available', () => {
      // Arrange
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0)',
        },
      }

      // Act
      const ua = extractUserAgent(req)

      // Assert
      expect(ua).toBe('Mozilla/5.0 (Windows NT 10.0)')
    })

    it('should extract user agent from User-Agent header (capitalized)', () => {
      // Arrange
      const req = {
        headers: {
          'User-Agent': 'Chrome/120.0.0.0',
        },
      }

      // Act
      const ua = extractUserAgent(req)

      // Assert
      expect(ua).toBe('Chrome/120.0.0.0')
    })

    it('should return "unknown" when user agent is not available', () => {
      // Arrange
      const req = {
        headers: {},
      }

      // Act
      const ua = extractUserAgent(req)

      // Assert
      expect(ua).toBe('unknown')
    })

    it('should return "unknown" when req.get returns undefined', () => {
      // Arrange
      const req = {
        get: vi.fn(() => undefined),
      }

      // Act
      const ua = extractUserAgent(req)

      // Assert
      expect(ua).toBe('unknown')
    })

    it('should handle array values in headers', () => {
      // Arrange
      const req = {
        headers: {
          'user-agent': ['Mozilla/5.0', 'Chrome/120.0'],
        },
      }

      // Act
      const ua = extractUserAgent(req)

      // Assert
      expect(ua).toBe('Mozilla/5.0')
    })
  })
})

