import { Router, Request, Response, NextFunction } from 'express'
import { container } from 'tsyringe'
import { QuestionController } from '../controllers/question.controller'
import { validate } from '../../../shared/middleware/validation.middleware'
import { authenticate, requireExaminer } from '../../../shared/middleware'
import { addQuestionSchema, updateQuestionSchema } from '../validation'

const router = Router()

// Lazy resolve dependencies from container (resolve when route is called, not at module load)
const getQuestionController = () =>
  container.resolve<QuestionController>('QuestionController')

/**
 * @swagger
 * /api/v1/exams/{id}/questions:
 *   post:
 *     summary: Add question to exam
 *     description: Add a new question to an exam (Examiner only)
 *     tags: [Questions]
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
 *             $ref: '#/components/schemas/AddQuestionRequest'
 *     responses:
 *       201:
 *         description: Question added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *                 message:
 *                   type: string
 *                   example: Question added successfully
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
 *         description: Exam not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/questions',
  authenticate,
  requireExaminer,
  validate(addQuestionSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getQuestionController().addQuestion(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/{id}/questions/{questionId}:
 *   put:
 *     summary: Update question
 *     description: Update an existing question in an exam (Examiner only)
 *     tags: [Questions]
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
 *             $ref: '#/components/schemas/UpdateQuestionRequest'
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *                 message:
 *                   type: string
 *                   example: Question updated successfully
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
 *         description: Exam or question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id/questions/:questionId',
  authenticate,
  requireExaminer,
  validate(updateQuestionSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getQuestionController().updateQuestion(req, res, next)
)

/**
 * @swagger
 * /api/v1/exams/{id}/questions/{questionId}:
 *   delete:
 *     summary: Delete question
 *     description: Delete a question from an exam (Examiner only)
 *     tags: [Questions]
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
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Question deleted successfully
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
 *                       example: Question deleted successfully
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
 *         description: Exam or question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id/questions/:questionId',
  authenticate,
  requireExaminer,
  (req: Request, res: Response, next: NextFunction) =>
    getQuestionController().deleteQuestion(req, res, next)
)

export default router
