import mongoose from 'mongoose'
import { ENV } from '../constants'
import { logger } from './logger'

/**
 * Database connection state
 */
let isConnected = false

/**
 * Database connection options
 * Optimized for write-heavy workloads
 */
const connectionOptions: mongoose.ConnectOptions = {
  // Connection Pool Settings (optimized for write-heavy workloads)
  maxPoolSize: ENV.MONGODB_MAX_POOL_SIZE, // Increased for write-heavy operations
  minPoolSize: ENV.MONGODB_MIN_POOL_SIZE, // Maintain warm connections
  maxIdleTimeMS: ENV.MONGODB_MAX_IDLE_TIME_MS, // Close idle connections after 30 seconds
  waitQueueTimeoutMS: ENV.MONGODB_WAIT_QUEUE_TIMEOUT_MS, // Max wait time for connection from pool

  // Timeout Settings
  connectTimeoutMS: ENV.MONGODB_CONNECT_TIMEOUT_MS, // Connection establishment timeout
  socketTimeoutMS: ENV.MONGODB_SOCKET_TIMEOUT_MS, // Socket inactivity timeout
  serverSelectionTimeoutMS: ENV.MONGODB_SERVER_SELECTION_TIMEOUT_MS, // Server selection timeout

  // Retry Settings
  retryWrites: true, // Automatically retry write operations on transient failures
  retryReads: true, // Automatically retry read operations on transient failures

  // Compression (reduces network bandwidth for write-heavy workloads)
  compressors: ENV.MONGODB_COMPRESSION_ENABLED ? ['zlib'] : [],
  zlibCompressionLevel: Math.min(
    Math.max(ENV.MONGODB_ZLIB_COMPRESSION_LEVEL, 0),
    9
  ) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, // Balance between CPU and compression (0-9)

  // Heartbeat Settings
  heartbeatFrequencyMS: ENV.MONGODB_HEARTBEAT_FREQUENCY_MS, // Check server status frequency
}

/**
 * Connect to MongoDB database
 * @returns Promise<void>
 */
export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Database already connected')
    return
  }

  try {
    logger.info('Attempting to connect to MongoDB...', {
      uri: ENV.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Mask credentials in logs
    })

    await mongoose.connect(ENV.MONGODB_URI, connectionOptions)

    isConnected = true

    logger.info('Successfully connected to MongoDB', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
      poolSize: {
        max: ENV.MONGODB_MAX_POOL_SIZE,
        min: ENV.MONGODB_MIN_POOL_SIZE,
      },
      compression: ENV.MONGODB_COMPRESSION_ENABLED
        ? `zlib (level ${ENV.MONGODB_ZLIB_COMPRESSION_LEVEL})`
        : 'disabled',
      retryWrites: true,
      retryReads: true,
    })

    // Set up connection event listeners
    setupConnectionListeners()
  } catch (error) {
    isConnected = false
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to connect to MongoDB', error, {
      uri: ENV.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
    })
    throw new Error(`Database connection failed: ${errorMessage}`)
  }
}

/**
 * Disconnect from MongoDB database gracefully
 * @returns Promise<void>
 */
export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    logger.info('Database already disconnected')
    return
  }

  try {
    logger.info('Disconnecting from MongoDB...')

    // Close all connections in the connection pool
    await mongoose.disconnect()

    isConnected = false

    logger.info('Successfully disconnected from MongoDB')
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', error)
    throw error
  }
}

/**
 * Setup MongoDB connection event listeners
 */
function setupConnectionListeners(): void {
  // Connection opened
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
    })
  })

  // Connection error
  mongoose.connection.on('error', error => {
    logger.error('MongoDB connection error', error)
    isConnected = false
  })

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    })
    isConnected = false
  })

  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB connection reestablished', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    })
    isConnected = true
  })
}

/**
 * Get database connection status
 * @returns boolean
 */
export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1
}

/**
 * Get database connection info
 * @returns Connection info object
 */
export function getDatabaseInfo() {
  return {
    isConnected: isDatabaseConnected(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name,
    models: Object.keys(mongoose.connection.models),
  }
}

/**
 * Graceful shutdown handler
 * Disconnects from database and exits the process
 * @param signal - Signal or reason for shutdown
 * @returns Promise<void>
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Starting graceful shutdown...`)

  try {
    // Disconnect from database
    await disconnectDatabase()
    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error('Error during graceful shutdown', error)
    process.exit(1)
  }
}
