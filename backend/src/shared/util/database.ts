import mongoose from 'mongoose'
import { ENV } from '../constants'
import { logger } from './logger'

/**
 * Database connection state
 */
let isConnected = false

/**
 * Database connection options
 */
const connectionOptions: mongoose.ConnectOptions = {
  // Connection pool settings
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  serverSelectionTimeoutMS: 3000, // How long to try before timing out (reduced for faster failure)

  // Retry settings
  retryWrites: true,
  retryReads: true,

  // Connection timeout
  connectTimeoutMS: 3000, // Timeout after 3 seconds if connection can't be established
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
