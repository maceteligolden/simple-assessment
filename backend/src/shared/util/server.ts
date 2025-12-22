import { Express } from 'express'
import { ENV, isDevelopment } from '../constants'
import { logger } from './logger'
import { connectDatabase, gracefulShutdown } from './database'

/**
 * Setup graceful shutdown handlers
 */
function setupShutdownHandlers(): void {
  // Setup graceful shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', error)
    gracefulShutdown('uncaughtException')
  })

  // Handle unhandled promise rejections
  process.on(
    'unhandledRejection',
    (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection', reason as Error, { promise })
      gracefulShutdown('unhandledRejection')
    }
  )
}

/**
 * Start the Express server
 * Connects to database and starts listening on the configured port
 * In development, database connection failure is non-fatal
 * @param app - Express application instance
 * @returns Promise<void>
 */
export async function startServer(app: Express): Promise<void> {
  try {
    // Try to connect to database with timeout
    try {
      // Use Promise.race to add an additional timeout safety net
      await Promise.race([
        connectDatabase(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Database connection timeout')),
            5000
          )
        ),
      ])
    } catch (dbError) {
      if (isDevelopment()) {
        logger.warn(
          'Database connection failed, but continuing in development mode',
          {
            error: dbError instanceof Error ? dbError.message : 'Unknown error',
            note: 'Server will start without database connection. Some features may not work.',
          }
        )
      } else {
        // In production/test, database is required
        logger.error('Database connection failed', dbError)
        throw dbError
      }
    }

    // Start server
    app.listen(ENV.PORT, () => {
      logger.info(`Server is running on port ${ENV.PORT}`, {
        environment: ENV.NODE_ENV,
        port: ENV.PORT,
        databaseConnected: isDevelopment() ? 'optional' : 'required',
      })
    })

    // Setup graceful shutdown handlers
    setupShutdownHandlers()
  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}
