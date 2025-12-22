import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  comparePassword,
} from '../../../src/shared/util/password'

describe('Password Utility', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      // Arrange
      const plainPassword = 'testPassword123'

      // Act
      const hashedPassword = await hashPassword(plainPassword)

      // Assert
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should produce different hashes for the same password', async () => {
      // Arrange
      const plainPassword = 'testPassword123'

      // Act
      const hash1 = await hashPassword(plainPassword)
      const hash2 = await hashPassword(plainPassword)

      // Assert
      expect(hash1).not.toBe(hash2) // bcrypt uses salt, so hashes differ
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      // Arrange
      const plainPassword = 'testPassword123'
      const hashedPassword = await hashPassword(plainPassword)

      // Act
      const result = await comparePassword(plainPassword, hashedPassword)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for non-matching password and hash', async () => {
      // Arrange
      const plainPassword = 'testPassword123'
      const wrongPassword = 'wrongPassword'
      const hashedPassword = await hashPassword(plainPassword)

      // Act
      const result = await comparePassword(wrongPassword, hashedPassword)

      // Assert
      expect(result).toBe(false)
    })
  })
})
