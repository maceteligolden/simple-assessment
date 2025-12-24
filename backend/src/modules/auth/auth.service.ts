import { injectable, inject } from 'tsyringe'
import { IUserRepository } from '../../shared/repository/user.repository'
import { ISessionService } from '../../shared/service/session.service'
import { hashPassword, comparePassword } from '../../shared/util/password'
import { generateTokens, verifyRefreshToken } from '../../shared/util/jwt'
import { logger, TransactionManager } from '../../shared/util'
import { extractIpAddress, extractUserAgent } from '../../shared/util/session'
import {
  SignUpInput,
  SignUpOutput,
  SignInInput,
  SignInOutput,
  RefreshTokenInput,
  RefreshTokenOutput,
  UserProfileOutput,
  CreateUserInput,
  IAuthService,
} from './interfaces/auth.interface'
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
} from '../../shared/errors'
import { IUser } from '../../shared/model/user.model'
import { Types } from 'mongoose'
import { UserRole } from '../../shared/constants/user-roles'

/**
 * User data structure for mapping to response
 * Represents the user object from repository with MongoDB _id
 */
interface UserForMapping {
  _id: Types.ObjectId
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/**
 * Auth Service Implementation
 * Handles all authentication business logic
 */
@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @inject('ISessionService')
    private readonly sessionService: ISessionService
  ) {
    logger.debug('AuthService initialized')
  }

  /**
   * Sign up a new user
   */
  async signUp(
    data: SignUpInput,
    req?: { ip?: string; headers?: Record<string, unknown> }
  ): Promise<SignUpOutput> {
    try {
      logger.info('Sign up attempt', { email: data.email, role: data.role })

      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(data.email)
      if (existingUser) {
        logger.warn('Sign up failed: Email already exists', {
          email: data.email,
          existingRole: existingUser.role,
          requestedRole: data.role,
        })

        // Provide specific error message if email exists with different role
        if (existingUser.role !== data.role) {
          throw new ConflictError(
            `This email is already registered as ${existingUser.role}. One email cannot be used for both examiner and participant roles.`
          )
        }
        throw new ConflictError('An account with this email already exists')
      }

      // Hash password
      let hashedPassword: string
      try {
        hashedPassword = await hashPassword(data.password)
      } catch (error) {
        logger.error('Password hashing failed during sign up', error)
        throw new InternalServerError(
          'Failed to process password. Please try again.'
        )
      }

      // Create user data
      const userData: CreateUserInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      }

      // Use transaction to ensure atomicity: create user + update refresh token
      const result = await TransactionManager.withTransaction<{
        user: IUser
        accessToken: string
        refreshToken: string
      }>(async session => {
        // 1. Create user (with session)
        let createdUser: IUser
        try {
          createdUser = await this.userRepository.create(userData, { session })
        } catch (error) {
          logger.error('User creation failed during sign up', error)
          // Check if it's a duplicate email error from MongoDB
          if (
            error instanceof Error &&
            (error.message.includes('duplicate') ||
              error.message.includes('E11000') ||
              error.message.includes('unique'))
          ) {
            throw new ConflictError('An account with this email already exists')
          }
          throw new InternalServerError(
            'Failed to create user account. Please try again.'
          )
        }

        logger.info('User registered successfully', {
          userId: createdUser._id.toString(),
          email: createdUser.email,
          role: createdUser.role,
        })

        // 2. Generate tokens
        const tokens = generateTokens({
          userId: createdUser._id.toString(),
          email: createdUser.email,
          role: createdUser.role,
        })

        // 3. Save refresh token to database (with session)
        const updatedUser = await this.userRepository.updateRefreshToken(
          createdUser._id.toString(),
          tokens.refreshToken,
          { session }
        )

        if (!updatedUser) {
          throw new InternalServerError(
            'Failed to save refresh token during sign up'
          )
        }

        return {
          user: updatedUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }
      })

      const { user, accessToken, refreshToken } = result

      logger.debug('Refresh token saved to database', {
        userId: user._id.toString(),
      })

      // Create session if request info is available
      let sessionToken: string | undefined
      if (req) {
        try {
          const session = await this.sessionService.createSession({
            userId: user._id.toString(),
            refreshToken,
            ipAddress: extractIpAddress(req),
            userAgent: extractUserAgent(req),
          })
          sessionToken = session.sessionToken
          logger.debug('Session created during sign up', {
            sessionId: session._id.toString(),
          })
        } catch (error) {
          logger.error('Failed to create session during sign up', error)
          // Don't fail sign up if session creation fails
        }
      }

      // Return response
      return {
        user: this.mapUserToResponse(user),
        accessToken,
        refreshToken,
        sessionToken, // Include session token if created
      }
    } catch (error) {
      logger.error('Error during sign up', error)
      throw error
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(
    data: SignInInput,
    req?: { ip?: string; headers?: Record<string, unknown> }
  ): Promise<SignInOutput> {
    try {
      logger.info('Sign in attempt', { email: data.email })

      // Find user by email (include password field)
      const user = await this.userRepository.findByEmail(data.email, true)
      if (!user) {
        logger.warn('Sign in failed: User not found', { email: data.email })
        throw new UnauthorizedError('Invalid email or password')
      }

      // Verify password
      let isPasswordValid: boolean
      try {
        isPasswordValid = await comparePassword(data.password, user.password)
      } catch (error) {
        logger.error('Password comparison failed during sign in', error)
        throw new InternalServerError(
          'Failed to verify password. Please try again.'
        )
      }

      if (!isPasswordValid) {
        logger.warn('Sign in failed: Invalid password', {
          email: data.email,
          userId: user._id.toString(),
        })
        throw new UnauthorizedError('Invalid email or password')
      }

      logger.info('User signed in successfully', {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      })

      // Generate tokens
      let accessToken: string
      let refreshToken: string
      try {
        const tokens = generateTokens({
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        })
        accessToken = tokens.accessToken
        refreshToken = tokens.refreshToken
      } catch (error) {
        logger.error('Token generation failed during sign in', error)
        throw new InternalServerError(
          'Failed to generate authentication tokens. Please try again.'
        )
      }

      // Save refresh token to database
      const updatedUser = await this.userRepository.updateRefreshToken(
        user._id.toString(),
        refreshToken
      )
      if (!updatedUser) {
        logger.warn('Failed to save refresh token, but sign in succeeded', {
          userId: user._id.toString(),
        })
      }

      logger.debug('Refresh token saved to database', {
        userId: user._id.toString(),
      })

      // Create session if request info is available
      let sessionToken: string | undefined
      if (req) {
        try {
          const session = await this.sessionService.createSession({
            userId: user._id.toString(),
            refreshToken,
            ipAddress: extractIpAddress(req),
            userAgent: extractUserAgent(req),
          })
          sessionToken = session.sessionToken
          logger.debug('Session created during sign in', {
            sessionId: session._id.toString(),
          })
        } catch (error) {
          logger.error('Failed to create session during sign in', error)
          // Don't fail sign in if session creation fails
        }
      }

      // Return response
      return {
        user: this.mapUserToResponse(user),
        accessToken,
        refreshToken,
        sessionToken, // Include session token if created
      }
    } catch (error) {
      logger.error('Error during sign in', error)
      throw error
    }
  }

  /**
   * Sign out (revoke current session)
   */
  async signOut(sessionId: string): Promise<void> {
    try {
      logger.info('Sign out attempt', { sessionId })

      await this.sessionService.revokeSession(sessionId)

      logger.info('Sign out successful', { sessionId })
    } catch (error) {
      logger.error('Error during sign out', error)
      throw error
    }
  }

  /**
   * Sign out from all devices (revoke all sessions)
   */
  async signOutAll(userId: string): Promise<number> {
    try {
      logger.info('Sign out all attempt', { userId })

      const count = await this.sessionService.revokeAllUserSessions(userId)

      logger.info('Sign out all successful', { userId, count })
      return count
    } catch (error) {
      logger.error('Error during sign out all', error)
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(data: RefreshTokenInput): Promise<RefreshTokenOutput> {
    try {
      logger.info('Refresh token attempt')

      if (!data.refreshToken) {
        throw new UnauthorizedError('Refresh token is required')
      }

      // Verify refresh token
      let decoded
      try {
        decoded = verifyRefreshToken(data.refreshToken)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Invalid refresh token'
        logger.warn('Refresh token verification failed', {
          error: errorMessage,
        })
        throw new UnauthorizedError(errorMessage)
      }

      // Find user and verify refresh token matches stored token
      const user = await this.userRepository.findById(
        decoded.userId,
        false,
        true
      )
      if (!user) {
        logger.warn('Refresh token failed: User not found', {
          userId: decoded.userId,
        })
        throw new NotFoundError('User not found')
      }

      // Verify stored refresh token matches provided token
      if (user.refreshToken !== data.refreshToken) {
        logger.warn('Refresh token failed: Token mismatch', {
          userId: user._id.toString(),
        })
        throw new UnauthorizedError('Invalid refresh token')
      }

      logger.info('Refresh token verified successfully', {
        userId: user._id.toString(),
        email: user.email,
      })

      // Generate new tokens
      let accessToken: string
      let newRefreshToken: string
      try {
        const tokens = generateTokens({
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        })
        accessToken = tokens.accessToken
        newRefreshToken = tokens.refreshToken
      } catch (error) {
        logger.error('Token generation failed during token refresh', error)
        throw new InternalServerError(
          'Failed to generate new tokens. Please try again.'
        )
      }

      // Update refresh token in database
      const updatedUser = await this.userRepository.updateRefreshToken(
        user._id.toString(),
        newRefreshToken
      )
      if (!updatedUser) {
        logger.warn('Failed to save refresh token, but tokens were generated', {
          userId: user._id.toString(),
        })
      }

      logger.debug('New refresh token saved to database', {
        userId: user._id.toString(),
      })

      // Return response
      return {
        accessToken,
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      logger.error('Error during token refresh', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserProfileOutput> {
    try {
      logger.debug('Getting user by ID', { userId })

      const user = await this.userRepository.findById(userId)
      if (!user) {
        logger.warn('User not found', { userId })
        throw new NotFoundError('User not found')
      }

      return this.mapUserToResponse(user)
    } catch (error) {
      logger.error('Error getting user by ID', error)
      throw error
    }
  }

  /**
   * Search user by email
   * Used by examiners to find participants to add to exams
   */
  async searchUserByEmail(email: string): Promise<UserProfileOutput | null> {
    try {
      logger.debug('Searching user by email', { email })

      const user = await this.userRepository.findByEmail(
        email.toLowerCase().trim()
      )
      if (!user) {
        logger.debug('User not found by email', { email })
        return null
      }

      return this.mapUserToResponse(user)
    } catch (error) {
      logger.error('Error searching user by email', error)
      throw error
    }
  }

  /**
   * Map IUser to UserProfileOutput (remove sensitive data)
   */
  private mapUserToResponse(user: IUser | UserForMapping): UserProfileOutput {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
