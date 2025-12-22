import { Router, Request, Response, NextFunction } from 'express'
import { container } from 'tsyringe'
import { ExamAttemptController } from '../controllers/exam-attempt.controller'
import { validate } from '../../../shared/middleware/validation.middleware'
import { authenticate, requireAnyRole } from '../../../shared/middleware'
import { startExamSchema, submitAnswerSchema } from '../validation'

const router = Router()

// Lazy resolve dependencies from container (resolve when route is called, not at module load)
const getAttemptController = () =>
  container.resolve<ExamAttemptController>('ExamAttemptController')

/**
 * @swagger
 * /api/v1/exams/start:
 *   post:
 *     summary: Start exam by access code
 *     description: Start an exam attempt by providing the exam access code
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartExamRequest'
 *     responses:
 *       201:
 *         description: Exam started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attempt'
 *                 message:
 *                   type: string
 *                   example: Exam started successfully
 *       400:
 *         description: Bad request - validation error or exam not available
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
 *         description: Forbidden - user not enrolled as participant
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
 *       409:
 *         description: Conflict - exam already started or completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/start',
  authenticate,
  requireAnyRole,
  validate(startExamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getAttemptController().startExam(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/attempts/{attemptId}/questions/next:
 *   get:
 *     summary: Get next question
 *     description: Get the next question in the exam (sequential)
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Next question retrieved successfully
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
 *                     question:
 *                       $ref: '#/components/schemas/Question'
 *                     questionNumber:
 *                       type: integer
 *                       example: 1
 *                     totalQuestions:
 *                       type: integer
 *                       example: 10
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not the owner of this attempt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attempt not found or no more questions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/attempts/:attemptId/questions/next',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getAttemptController().getNextQuestion(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/attempts/{attemptId}/answers/{questionId}:
 *   put:
 *     summary: Submit or update answer
 *     description: Submit or update an answer for a question in an exam attempt
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: 507f1f77bcf86cd799439012
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAnswerRequest'
 *     responses:
 *       200:
 *         description: Answer submitted successfully
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
 *                       example: Answer submitted successfully
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
 *         description: Forbidden - not the owner of this attempt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attempt or question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/attempts/:attemptId/answers/:questionId',
  authenticate,
  requireAnyRole,
  validate(submitAnswerSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getAttemptController().submitAnswer(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/attempts/{attemptId}/submit:
 *   post:
 *     summary: Submit exam
 *     description: Submit the exam attempt for grading
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Exam submitted successfully
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
 *                     attempt:
 *                       $ref: '#/components/schemas/Attempt'
 *                     message:
 *                       type: string
 *                       example: Exam submitted successfully
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not the owner of this attempt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - exam already submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/attempts/:attemptId/submit',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getAttemptController().submitExam(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/attempts/{attemptId}/results:
 *   get:
 *     summary: Get attempt results
 *     description: Get detailed results for an exam attempt
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Attempt results retrieved successfully
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
 *         description: Forbidden - not the owner of this attempt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attempt or results not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/attempts/:attemptId/results',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getAttemptController().getAttemptResults(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/results/my-results:
 *   get:
 *     summary: Get my exam results
 *     description: Get all exam results for the authenticated user (participant view)
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Results retrieved successfully
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
 *                     $ref: '#/components/schemas/AttemptResult'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/results/my-results',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getAttemptController().getMyResults(req, res, next)
)

export default router
