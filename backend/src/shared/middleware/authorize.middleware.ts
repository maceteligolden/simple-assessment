import { Request, Response, NextFunction } from 'express'
import { logger } from '../util/logger'
import { ResponseUtil } from '../util/response'
import { HTTP_STATUS, UserRole } from '../constants'

/**
 * Role-based Authorization Middleware
 *
 * This middleware should be used AFTER authentication middleware.
 * It checks if the authenticated user has one of the required roles.
 *
 * @param allowedRoles - Array of roles permitted to access the endpoint
 * @returns Express middleware function
 *
 * @example
 * // Allow only examiners
 * router.get('/exams', authenticate, requireRoles([USER_ROLES.EXAMINER]), controller.getExams)
 *
 * @example
 * // Allow both examiners and participants
 * router.get('/profile', authenticate, requireRoles([USER_ROLES.EXAMINER, USER_ROLES.PARTICIPANT]), controller.getProfile)
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated first
    // This middleware assumes authentication has already been verified
    if (!req.user) {
      logger.warn('Role authorization failed: User not authenticated', {
        path: req.path,
        method: req.method,
      })
      ResponseUtil.error(
        res,
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED
      )
      return
    }

    const userRole = req.user.role

    // Check if user has one of the required roles
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role authorization failed: Insufficient permissions', {
        userId: req.user.userId,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
      })
      ResponseUtil.error(
        res,
        'You do not have permission to access this resource',
        HTTP_STATUS.FORBIDDEN
      )
      return
    }

    logger.debug('Role authorization successful', {
      userId: req.user.userId,
      userRole,
      requiredRoles: allowedRoles,
      path: req.path,
    })

    next()
  }
}

/**
 * Convenience middleware for examiner-only endpoints
 *
 * @example
 * router.post('/exams', authenticate, requireExaminer, controller.createExam)
 */
export const requireExaminer = requireRoles(['examiner'])

/**
 * Convenience middleware for participant-only endpoints
 *
 * @example
 * router.get('/my-results', authenticate, requireParticipant, controller.getMyResults)
 */
export const requireParticipant = requireRoles(['participant'])

/**
 * Convenience middleware for any authenticated user (both roles)
 *
 * @example
 * router.get('/profile', authenticate, requireAnyRole, controller.getProfile)
 */
export const requireAnyRole = requireRoles(['examiner', 'participant'])

/**
 * Legacy function name for backward compatibility
 * @deprecated Use requireRoles instead
 */
export const authorize = requireRoles
