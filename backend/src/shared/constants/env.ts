import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Environment Configuration
 * Centralized access to all environment variables with type safety
 */
export const ENV = {
  // Server Configuration
  NODE_ENV: (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'production'
    | 'test',
  PORT: parseInt(process.env.PORT || '5008', 10),

  // Logging
  LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as
    | 'error'
    | 'warn'
    | 'info'
    | 'debug'
    | 'verbose',

  // Database
  MONGODB_URI:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-assessment',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m', // Access token expires in 15 minutes
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    'your-refresh-secret-key-change-in-production',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Refresh token expires in 7 days

  // Session Management
  SESSION_DURATION_MINUTES: parseInt(
    process.env.SESSION_DURATION_MINUTES || '60',
    10
  ), // Session duration in minutes
  SESSION_CLEANUP_INTERVAL_MINUTES: parseInt(
    process.env.SESSION_CLEANUP_INTERVAL_MINUTES || '60',
    10
  ), // Cleanup interval in minutes

  // API Version
  API_VERSION: process.env.API_VERSION || 'v1',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
} as const

/**
 * Environment helper functions
 */
export const isDevelopment = (): boolean => ENV.NODE_ENV === 'development'
export const isProduction = (): boolean => ENV.NODE_ENV === 'production'
export const isTest = (): boolean => ENV.NODE_ENV === 'test'
