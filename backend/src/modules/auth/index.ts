export { default as authRoutes } from './auth.routes'
export * from './auth.controller'
export * from './auth.service'
export * from './interfaces'
export { AuthService } from './auth.service'
export { AuthController } from './auth.controller'
export { IAuthService, IAuthController } from './interfaces'
// Export validation schemas only, not types (types are in interfaces)
export {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
  validateSignUp,
  validateSignIn,
} from './auth.validation'
