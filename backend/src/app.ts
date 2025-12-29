import 'reflect-metadata'
import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import swaggerUi from 'swagger-ui-express'
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
} from './shared/middleware'
import { ResponseUtil } from './shared/util'
import { authRoutes } from './modules/auth'
import { examRoutes } from './modules/exam'
import { ENV } from './shared/constants'
import { setupContainer } from './shared/container'
import { swaggerSpec } from './shared/config/swagger.config'

// Setup dependency injection container
setupContainer()

const app = express()

// Trust proxy - required for rate limiting and getting real IP behind reverse proxies (Netlify, Render, etc.)
app.set('trust proxy', 1)

// Middleware
// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// Prevent NoSQL Injection
app.use(mongoSanitize())

// CORS configuration - support multiple origins (development and production)
const allowedOrigins = [
  'http://localhost:3000', // Local development
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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Health check
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

export default app

