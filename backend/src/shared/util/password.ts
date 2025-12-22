import bcrypt from 'bcryptjs'
import { logger } from './logger'

/**
 * Hash a password
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    logger.debug('Password hashed successfully')
    return hashedPassword
  } catch (error) {
    logger.error('Error hashing password', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Compare a password with a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Promise<boolean> - True if passwords match
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash)
    logger.debug('Password comparison completed', { isMatch })
    return isMatch
  } catch (error) {
    logger.error('Error comparing password', error)
    throw new Error('Failed to compare password')
  }
}
