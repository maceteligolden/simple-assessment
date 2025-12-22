import { UserRole } from './user.interface'

/**
 * Central Authentication Interfaces
 * Following Input/Output naming convention to match backend
 */

/**
 * User profile output (without sensitive information)
 */
export interface UserProfileOutput {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}

/**
 * Sign up input
 */
export interface SignUpInput {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

/**
 * Sign up output
 */
export interface SignUpOutput {
  user: UserProfileOutput
  accessToken: string
  refreshToken: string
}

/**
 * Sign in input
 */
export interface SignInInput {
  email: string
  password: string
}

/**
 * Sign in output
 */
export interface SignInOutput {
  user: UserProfileOutput
  accessToken: string
  refreshToken: string
}

/**
 * Refresh token input
 */
export interface RefreshTokenInput {
  refreshToken: string
}

/**
 * Refresh token output
 */
export interface RefreshTokenOutput {
  accessToken: string
  refreshToken: string
}

/**
 * Legacy interfaces for backward compatibility (deprecated)
 * @deprecated Use SignInInput/SignInOutput instead
 */
export interface LoginCredentials extends SignInInput {}

/**
 * Legacy interfaces for backward compatibility (deprecated)
 * @deprecated Use SignUpInput/SignUpOutput instead
 */
export interface RegisterData extends SignUpInput {}

/**
 * Legacy interfaces for backward compatibility (deprecated)
 * @deprecated Use SignInOutput or SignUpOutput instead
 */
export interface AuthResponse {
  user: UserProfileOutput
  token: string
}

