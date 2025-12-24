// Middleware exports

export * from './error-handler'
export * from './request-logger'
export * from './validation.middleware'
export * from './auth.middleware'
export * from './authorize.middleware'
export * from './session.middleware'
export * from './rate-limit.middleware'

// Re-export role middleware with clearer names
export {
  requireRoles,
  requireExaminer,
  requireParticipant,
  requireAnyRole,
  authorize, // Legacy export for backward compatibility
} from './authorize.middleware'
