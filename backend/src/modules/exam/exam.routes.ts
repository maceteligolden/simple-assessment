import { Router } from 'express'
import {
  examRoutes,
  questionRoutes,
  participantRoutes,
  attemptRoutes,
} from './routes'

const router = Router()

// Mount all exam-related routes
router.use('/', examRoutes)
router.use('/', questionRoutes)
router.use('/', participantRoutes)
router.use('/', attemptRoutes)

export default router
