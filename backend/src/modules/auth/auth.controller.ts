import { injectable, inject } from 'tsyringe'
import { Request, Response, NextFunction } from 'express'
import { ResponseUtil } from '../../shared/util/response'
import { HTTP_STATUS } from '../../shared/constants'
import { logger } from '../../shared/util/logger'
import { SignUpInput, SignInInput } from './auth.validation'
import { IAuthService, IAuthController } from './interfaces/auth.interface'
import { UnauthorizedError } from '../../shared/errors'

/**
 * Auth Controller Implementation
 * Handles HTTP requests and delegates to AuthService
 * Uses dependency injection for AuthService
 */
@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject('IAuthService')
    private readonly authService: IAuthService
  ) {
    logger.debug('AuthController initialized')
  }

  /**
   * Sign up controller
   * Handles user registration for both examiner and participant roles
   */
  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = req as SignUpInput
      const { firstName, lastName, email, password, role } = body

      const result = await this.authService.signUp(
        {
          firstName,
          lastName,
          email,
          password,
          role,
        },
        req
      )

      ResponseUtil.created(res, result, {
        message: 'Account created successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sign in controller
   * Handles user authentication for both examiner and participant roles
   */
  async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = req as SignInInput
      const { email, password } = body

      const result = await this.authService.signIn(
        {
          email,
          password,
        },
        req
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Signed in successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sign out controller
   * Revokes the current session
   */
  async signOut(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found'))
      }

      await this.authService.signOut(req.session.id)

      ResponseUtil.success(
        res,
        { message: 'Signed out successfully' },
        HTTP_STATUS.OK
      )
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sign out from all devices controller
   * Revokes all sessions for the current user
   */
  async signOutAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await this.authService.signOutAll(req.user.userId)

      ResponseUtil.success(
        res,
        {
          message: 'Signed out from all devices successfully',
          revokedSessions: count,
        },
        HTTP_STATUS.OK
      )
    } catch (error) {
      next(error)
    }
  }

  /**
   * Refresh token controller
   * Generates a new access token using a valid refresh token
   */
  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken: token } = req.body

      const result = await this.authService.refreshToken({
        refreshToken: token,
      })

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Tokens refreshed successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get current user profile
   * Returns the authenticated user's information
   */
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await this.authService.getUserById(req.user.userId)

      ResponseUtil.success(res, user, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Search users by email
   * Used by examiners to find participants to add to exams
   */
  async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.query as { email: string }

      const user = await this.authService.searchUserByEmail(email)

      ResponseUtil.success(res, { user, exists: !!user }, HTTP_STATUS.OK, {
        message: user ? 'User found' : 'User not found',
      })
    } catch (error) {
      next(error)
    }
  }
}
