import winston from 'winston'
import { ENV } from '../constants'

const { combine, timestamp, errors, json, printf, colorize } = winston.format

/**
 * Custom format for console output
 */
const consoleFormat = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${stack || message}`
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`
    }
    return msg
  }
)

/**
 * Logger Service
 * Provides structured logging using Winston
 */
class LoggerService {
  private logger: winston.Logger

  constructor() {
    this.logger = winston.createLogger({
      level: ENV.LOG_LEVEL,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      ),
      defaultMeta: { service: 'simple-assessment-backend' },
      transports: [
        // Write all logs to console
        new winston.transports.Console({
          format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            consoleFormat
          ),
        }),
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: combine(timestamp(), errors({ stack: true }), json()),
        }),
        // Write all logs to combined.log
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: combine(timestamp(), errors({ stack: true }), json()),
        }),
      ],
      // Handle exceptions
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
      ],
      // Handle promise rejections
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
      ],
    })
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, unknown>
  ): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      })
    } else {
      this.logger.error(message, { error, ...metadata })
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logger.warn(message, metadata)
  }

  /**
   * Log an informational message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(message, metadata)
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.logger.debug(message, metadata)
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, metadata?: Record<string, unknown>): void {
    this.logger.verbose(message, metadata)
  }

  /**
   * Log HTTP request
   */
  http(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(message, { ...metadata, type: 'http' })
  }

  /**
   * Get the underlying winston logger instance
   */
  getLogger(): winston.Logger {
    return this.logger
  }
}

// Export singleton instance
export const logger = new LoggerService()
