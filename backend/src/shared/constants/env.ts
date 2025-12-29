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

  // MongoDB Connection Pool Configuration
  MONGODB_MAX_POOL_SIZE: parseInt(
    process.env.MONGODB_MAX_POOL_SIZE || '50',
    10
  ), // Maximum connections in pool (increased for write-heavy workloads)
  MONGODB_MIN_POOL_SIZE: parseInt(
    process.env.MONGODB_MIN_POOL_SIZE || '10',
    10
  ), // Minimum connections to maintain (warm connections)
  MONGODB_MAX_IDLE_TIME_MS: parseInt(
    process.env.MONGODB_MAX_IDLE_TIME_MS || '30000',
    10
  ), // Close idle connections after 30 seconds

  // MongoDB Timeout Configuration
  MONGODB_CONNECT_TIMEOUT_MS: parseInt(
    process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000',
    10
  ), // Connection timeout: 10 seconds
  MONGODB_SOCKET_TIMEOUT_MS: parseInt(
    process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000',
    10
  ), // Socket timeout: 45 seconds
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000',
    10
  ), // Server selection timeout: 5 seconds
  MONGODB_WAIT_QUEUE_TIMEOUT_MS: parseInt(
    process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || '10000',
    10
  ), // Max wait time for connection from pool: 10 seconds

  // MongoDB Compression
  MONGODB_COMPRESSION_ENABLED:
    process.env.MONGODB_COMPRESSION_ENABLED !== 'false', // Default: true
  MONGODB_ZLIB_COMPRESSION_LEVEL: parseInt(
    process.env.MONGODB_ZLIB_COMPRESSION_LEVEL || '6',
    10
  ), // Zlib compression level (1-9, default: 6)

  // MongoDB Heartbeat
  MONGODB_HEARTBEAT_FREQUENCY_MS: parseInt(
    process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || '10000',
    10
  ), // Heartbeat check frequency: 10 seconds

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

  // Cache Configuration
  CACHE_DEFAULT_TTL_SECONDS: parseInt(
    process.env.CACHE_DEFAULT_TTL_SECONDS || '3600',
    10
  ), // Default cache TTL: 1 hour
  CACHE_CHECK_PERIOD_SECONDS: parseInt(
    process.env.CACHE_CHECK_PERIOD_SECONDS || '600',
    10
  ), // Cache expiration check period: 10 minutes
} as const

/**
 * Environment helper functions
 */
export const isDevelopment = (): boolean => ENV.NODE_ENV === 'development'
export const isProduction = (): boolean => ENV.NODE_ENV === 'production'
export const isTest = (): boolean => ENV.NODE_ENV === 'test'
