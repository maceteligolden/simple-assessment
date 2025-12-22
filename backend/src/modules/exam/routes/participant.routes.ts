import { Router, Request, Response, NextFunction } from 'express'
import { container } from 'tsyringe'
import { ExamParticipantController } from '../controllers/exam-participant.controller'
import { validate } from '../../../shared/middleware/validation.middleware'
import {
  authenticate,
  requireExaminer,
  requireAnyRole,
} from '../../../shared/middleware'
import { addParticipantSchema } from '../validation'

const router = Router()

// Lazy resolve dependencies from container (resolve when route is called, not at module load)
const getParticipantController = () =>
  container.resolve<ExamParticipantController>('ExamParticipantController')

/**
 * @swagger
 * /api/v1/exams/{id}/participants:
 *   post:
 *     summary: Add participant to exam
 *     description: Add a participant to an exam (Examiner only)
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddParticipantRequest'
 *     responses:
 *       201:
 *         description: Participant added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Participant'
 *                 message:
 *                   type: string
 *                   example: Participant added successfully
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - examiner role required or not exam owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Exam or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - participant already added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/participants',
  authenticate,
  requireExaminer,
  validate(addParticipantSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getParticipantController().addParticipant(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/{id}/participants:
 *   get:
 *     summary: List all participants for an exam
 *     description: List all participants for an exam (Examiner only)
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Participant'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - examiner role required or not exam owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Exam not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/participants',
  authenticate,
  requireExaminer,
  (req: Request, res: Response, next: NextFunction) =>
    getParticipantController().listParticipants(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/participants/{participantId}:
 *   delete:
 *     summary: Remove participant from exam
 *     description: Remove a participant from an exam (Examiner only)
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Participant ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Participant removed successfully
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
 *                     message:
 *                       type: string
 *                       example: Participant removed successfully
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - examiner role required or not exam owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Participant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/participants/:participantId',
  authenticate,
  requireExaminer,
  (req: Request, res: Response, next: NextFunction) =>
    getParticipantController().removeParticipant(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/{id}/participants/{participantId}/result:
 *   get:
 *     summary: Get participant result
 *     description: Get participant result (detailed view) - Examiner only
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Participant ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Participant result retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AttemptResult'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - examiner role required or not exam owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Exam, participant, or result not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/participants/:participantId/result',
  authenticate,
  requireExaminer,
  (req: Request, res: Response, next: NextFunction) =>
    getParticipantController().getParticipantResult(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/my-exams:
 *   get:
 *     summary: Get all exams I'm enrolled in
 *     description: Get all exams I'm enrolled in (participant view) - All authenticated users
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for exam title or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_started, in-progress, completed, abandoned]
 *         description: Filter by attempt status
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by exam availability
 *     responses:
 *       200:
 *         description: Enrolled exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       examId:
 *                         type: string
 *                       participantId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       questionCount:
 *                         type: number
 *                       accessCode:
 *                         type: string
 *                       attemptStatus:
 *                         type: string
 *                         enum: [not_started, in-progress, completed, abandoned]
 *                       attemptId:
 *                         type: string
 *                       score:
 *                         type: number
 *                       maxScore:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       startedAt:
 *                         type: string
 *                       submittedAt:
 *                         type: string
 *                       isAvailable:
 *                         type: boolean
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/my-exams',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getParticipantController().getMyExams(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/my-exams/not-started:
 *   get:
 *     summary: Get all not-started exams I'm enrolled in
 *     description: Get all exams I'm enrolled in that haven't been started yet (participant view) - All authenticated users
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for exam title or description
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by exam availability
 *     responses:
 *       200:
 *         description: Not-started exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       examId:
 *                         type: string
 *                       participantId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       questionCount:
 *                         type: number
 *                       accessCode:
 *                         type: string
 *                       attemptStatus:
 *                         type: string
 *                         enum: [not_started]
 *                       isAvailable:
 *                         type: boolean
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/my-exams/not-started',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getParticipantController().getMyNotStartedExams(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/participants/me:
 *   get:
 *     summary: Get all exams I'm enrolled in
 *     description: Get all exams I'm enrolled in (participant view) with pagination - All authenticated users
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for exam title or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_started, in-progress, completed, abandoned]
 *         description: Filter by attempt status
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by exam availability
 *     responses:
 *       200:
 *         description: Enrolled exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       examId:
 *                         type: string
 *                       participantId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       questionCount:
 *                         type: number
 *                       accessCode:
 *                         type: string
 *                         description: Access code assigned to the participant for this exam
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *                       attemptStatus:
 *                         type: string
 *                         enum: [not_started, in-progress, completed, abandoned]
 *                       attemptId:
 *                         type: string
 *                       score:
 *                         type: number
 *                       maxScore:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                       isAvailable:
 *                         type: boolean
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/participants/me',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getParticipantController().getMyExams(req, res, next)
)

export default router
