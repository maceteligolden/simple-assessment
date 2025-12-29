import { Router } from 'express'
import examRoutes from './routes/exam.routes'
import questionRoutes from './routes/question.routes'
import participantRoutes from './routes/participant.routes'
import attemptRoutes from './routes/attempt.routes'

const router = Router()

// Combine all exam-related routes
router.use('/', examRoutes)
router.use('/', questionRoutes)
router.use('/', participantRoutes)
router.use('/', attemptRoutes)

export { router as examRoutes }
export * from './controllers'
export * from './services'
export * from './factory'
export * from './interfaces'
// Export validation schemas only, not types (types are in interfaces)
export {
  createExamSchema,
  updateExamSchema,
  addQuestionSchema,
  updateQuestionSchema,
  addParticipantSchema,
  startExamSchema,
  submitAnswerSchema,
} from './validation'
