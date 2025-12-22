import { Router, Request, Response, NextFunction } from 'express'
import { container } from 'tsyringe'
import { AuthController } from './auth.controller'
import { validate } from '../../shared/middleware/validation.middleware'
import {
  authenticate,
  requireAnyRole,
  requireExaminer,
} from '../../shared/middleware'
import {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
  searchUsersSchema,
} from './auth.validation'

const router = Router()

// Lazy resolve dependencies from container (resolve when route is called, not at module load)
const getAuthController = () =>
  container.resolve<AuthController>('AuthController')

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user (examiner or participant)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpRequest'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/signup',
  validate(signUpSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getAuthController().signUp(req, res, next)
)

/**
 * @swagger
 * /api/v1/auth/signin:
 *   post:
 *     summary: Sign in user
 *     description: Sign in user (examiner or participant)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInRequest'
 *     responses:
 *       200:
 *         description: Signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *                 message:
 *                   type: string
 *                   example: Signed in successfully
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/signin',
  validate(signInSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getAuthController().signIn(req, res, next)
)

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refresh access token using refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
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
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 message:
 *                   type: string
 *                   example: Tokens refreshed successfully
 *       401:
 *         description: Unauthorized - invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  (req: Request, res: Response, next: NextFunction) =>
    getAuthController().refreshToken(req, res, next)
)

/**
 * @swagger
 * /api/v1/auth/signout:
 *   post:
 *     summary: Sign out
 *     description: Sign out (revoke current session)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signed out successfully
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
 *                       example: Signed out successfully
 *       401:
 *         description: Unauthorized - no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/signout',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getAuthController().signOut(req, res, next)
)

/**
 * @swagger
 * /api/v1/auth/signout-all:
 *   post:
 *     summary: Sign out from all devices
 *     description: Sign out from all devices (revoke all sessions)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signed out from all devices successfully
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
 *                       example: Signed out from all devices successfully
 *                     revokedSessions:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/signout-all',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getAuthController().signOutAll(req, res, next)
)

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/profile',
  authenticate,
  requireAnyRole,
  (req: Request, res: Response, next: NextFunction) =>
    getAuthController().getProfile(req, res, next)
)

/**
 * @swagger
 * /api/v1/auth/search:
 *   get:
 *     summary: Search users by email
 *     description: Search users by email (for examiners to find participants)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to search for
 *         example: participant@example.com
 *     responses:
 *       200:
 *         description: User search result
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                       nullable: true
 *                     exists:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: User found
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - examiner role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/search',
  authenticate,
  requireExaminer,
  validate(searchUsersSchema, 'query'),
  (req: Request, res: Response, next: NextFunction) =>
    getAuthController().searchUsers(req, res, next)
)

export default router
