/**
 * Environment Constants
 * Centralized access to all environment variables
 */

/**
 * Environment values
 */
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
} as const

export type Environment = typeof ENVIRONMENT[keyof typeof ENVIRONMENT]

/**
 * Environment variables
 */
export const ENV = {
  NODE_ENV: (process.env.NODE_ENV as Environment) || ENVIRONMENT.DEVELOPMENT,
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5008',
  BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true',
} as const

/**
 * Helper functions for environment checks
 */
export const isDevelopment = (): boolean => {
  return ENV.NODE_ENV === ENVIRONMENT.DEVELOPMENT
}

export const isProduction = (): boolean => {
  return ENV.NODE_ENV === ENVIRONMENT.PRODUCTION
}

