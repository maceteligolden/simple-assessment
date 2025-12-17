import express, { Request, Response } from 'express'
import cors from 'cors'
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
} from './shared/middleware'
import { logger } from './shared/util'
import { ENV } from './shared/constants'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Request logging middleware (should be before routes)
app.use(requestLogger)

// Routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 404 handler (must be after all routes)
app.use(notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

// Start server
app.listen(ENV.PORT, () => {
  logger.info(`Server is running on port ${ENV.PORT}`, {
    environment: ENV.NODE_ENV,
    port: ENV.PORT,
  })
})
