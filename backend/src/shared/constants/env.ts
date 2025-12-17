import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment Configuration
 * Centralized access to all environment variables with type safety
 */
export const ENV = {
  // Server Configuration
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  PORT: parseInt(process.env.PORT || '5008', 10),

  // Logging
  LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug' | 'verbose',

  // Database (add when needed)
  // DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT (add when needed)
  // JWT_SECRET: process.env.JWT_SECRET || '',
  // JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // CORS (add when needed)
  // CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
} as const;

/**
 * Environment helper functions
 */
export const isDevelopment = (): boolean => ENV.NODE_ENV === 'development';
export const isProduction = (): boolean => ENV.NODE_ENV === 'production';
export const isTest = (): boolean => ENV.NODE_ENV === 'test';

