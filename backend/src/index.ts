import 'reflect-metadata'
import express, { Request, Response } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  generalRateLimiter,
} from './shared/middleware'
import { startServer } from './shared/util'
import { ResponseUtil } from './shared/util'
import { authRoutes } from './modules/auth'
import { examRoutes } from './modules/exam'
import { ENV } from './shared/constants'
import { setupContainer } from './shared/container'
import { swaggerSpec } from './shared/config/swagger.config'

// Setup dependency injection container
setupContainer()

const app = express()

// Middleware
// CORS configuration - support multiple origins (development and production)
const allowedOrigins = [
  'http://localhost:3001', // Local development
  'https://simpleassessments.netlify.app', // Production Netlify
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []), // Additional origins from env
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json())

// Request logging middleware (should be before routes)
app.use(requestLogger)

// Rate limiting middleware (applied to all routes)
app.use(generalRateLimiter)

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Routes
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the server is running
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     message:
 *                       type: string
 *                       example: Server is running
 */
app.get('/health', (_req: Request, res: Response) => {
  ResponseUtil.success(res, {
    status: 'ok',
    message: 'Server is running',
  })
})

// API Routes (versioned)
const apiBasePath = `/api/${ENV.API_VERSION}`
app.use(`${apiBasePath}/auth`, authRoutes)
app.use(`${apiBasePath}/exams`, examRoutes)

// 404 handler (must be after all routes)
app.use(notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

// Start the server
startServer(app).catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
