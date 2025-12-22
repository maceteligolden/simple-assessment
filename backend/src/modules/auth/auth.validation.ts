import { z } from 'zod'
import { logger } from '../../shared/util/logger'
import { USER_ROLE_VALUES } from '../../shared/constants'

/**
 * Validation schemas for authentication
 */

// Common email validation
const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()

// Common password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Role validation - automatically uses all roles from constants
const roleSchema = z.enum(USER_ROLE_VALUES, {
  message: `Role must be one of: ${USER_ROLE_VALUES.join(', ')}`,
})

/**
 * Sign up validation schema
 */
export const signUpSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .trim(),
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
  }),
})

/**
 * Sign in validation schema
 */
export const signInSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
})

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
})

/**
 * Search users validation schema
 */
export const searchUsersSchema = z.object({
  query: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .min(1, 'Email is required'),
  }),
})

/**
 * Type exports for TypeScript
 */
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type SearchUsersInput = z.infer<typeof searchUsersSchema>

/**
 * Validate sign up data
 */
export function validateSignUp(data: unknown): SignUpInput {
  try {
    return signUpSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Sign up validation failed', { errors: error.issues })
      throw error
    }
    logger.error('Unexpected validation error', error)
    throw error
  }
}

/**
 * Validate sign in data
 */
export function validateSignIn(data: unknown): SignInInput {
  try {
    return signInSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Sign in validation failed', { errors: error.issues })
      throw error
    }
    logger.error('Unexpected validation error', error)
    throw error
  }
}
