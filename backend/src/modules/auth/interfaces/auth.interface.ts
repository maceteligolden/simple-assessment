import { Request, Response, NextFunction } from 'express'
import { UserRole } from '../../../shared/constants/user-roles'
import { IUser } from '../../../shared/model/user.model'

/**
 * Central Authentication Interfaces
 * All auth-related interfaces are defined here
 * Following Input/Output naming convention
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
  createdAt?: Date
  updatedAt?: Date
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
  sessionToken?: string
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
  sessionToken?: string
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
 * Create user input (for repository)
 */
export interface CreateUserInput {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  refreshToken?: string
}

/**
 * Update user input (for repository)
 */
export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  refreshToken?: string
}

/**
 * User query filters
 */
export interface UserFilters {
  email?: string
  role?: UserRole
  _id?: string
}

/**
 * Auth Controller Interface
 * Defines the contract for authentication HTTP handlers
 */
export interface IAuthController {
  signUp(req: Request, res: Response, next: NextFunction): Promise<void>
  signIn(req: Request, res: Response, next: NextFunction): Promise<void>
  signOut(req: Request, res: Response, next: NextFunction): Promise<void>
  signOutAll(req: Request, res: Response, next: NextFunction): Promise<void>
  refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>
  getProfile(req: Request, res: Response, next: NextFunction): Promise<void>
  searchUsers(req: Request, res: Response, next: NextFunction): Promise<void>
}

/**
 * Auth Service Interface
 * Defines the contract for authentication operations
 */
export interface IAuthService {
  signUp(
    data: SignUpInput,
    req?: { ip?: string; headers?: Record<string, unknown> }
  ): Promise<SignUpOutput>
  signIn(
    data: SignInInput,
    req?: { ip?: string; headers?: Record<string, unknown> }
  ): Promise<SignInOutput>
  signOut(sessionId: string): Promise<void>
  signOutAll(userId: string): Promise<number>
  refreshToken(data: RefreshTokenInput): Promise<RefreshTokenOutput>
  getUserById(userId: string): Promise<UserProfileOutput>
  searchUserByEmail(email: string): Promise<UserProfileOutput | null>
}
