import { UserRole } from '../shared/constants/user-roles'

/**
 * Global Express Type Extension
 * This allows us to use req.user and req.session with full type safety
 * across the entire application.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * The authenticated user payload from JWT
       */
      user: {
        userId: string
        email: string
        role: UserRole
      }

      /**
       * Custom session tracking information from database
       */
      session?: {
        id: string
        userId: string
        sessionToken: string
        expiresAt: Date
        lastActivity: Date
      }
    }
  }
}

export {}
