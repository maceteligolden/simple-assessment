import { ResponseInput, ResponseOutput } from './response.interface'

/**
 * Session Interfaces
 * Following the Input/Output naming convention for business logic
 */

// Create Session
export interface CreateSessionInput extends ResponseInput {
  body: {
    userId: string
    sessionToken: string
    refreshToken: string
    ipAddress?: string
    userAgent?: string
    expiresAt: Date
  }
}

export interface CreateSessionOutput extends ResponseOutput<{
  id: string
  userId: string
  sessionToken: string
  expiresAt: Date
  lastActivity: Date
  isActive: boolean
}> {}

// Get Session by Token
export interface GetSessionByTokenInput extends ResponseInput {
  params?: {
    token?: string
  }
  query?: {
    token?: string
  }
}

export interface GetSessionByTokenOutput extends ResponseOutput<{
  id: string
  userId: string
  sessionToken: string
  refreshToken: string
  ipAddress?: string
  userAgent?: string
  expiresAt: Date
  lastActivity: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}> {}

// Update Session Activity
export interface UpdateSessionActivityInput extends ResponseInput {
  params: {
    sessionId: string
  }
}

export interface UpdateSessionActivityOutput extends ResponseOutput<{
  id: string
  lastActivity: Date
}> {}

// Revoke Session
export interface RevokeSessionInput extends ResponseInput {
  params: {
    sessionId: string
  }
}

export interface RevokeSessionOutput extends ResponseOutput<{
  message: string
  sessionId: string
}> {}

// Revoke All User Sessions
export interface RevokeAllUserSessionsInput extends ResponseInput {
  params: {
    userId: string
  }
}

export interface RevokeAllUserSessionsOutput extends ResponseOutput<{
  message: string
  revokedCount: number
}> {}

// Get User Sessions
export interface GetUserSessionsInput extends ResponseInput {
  params: {
    userId: string
  }
  query?: {
    activeOnly?: string
  }
}

export interface GetUserSessionsOutput extends ResponseOutput<
  Array<{
    id: string
    sessionToken: string
    ipAddress?: string
    userAgent?: string
    expiresAt: Date
    lastActivity: Date
    isActive: boolean
    createdAt: Date
  }>
> {}
