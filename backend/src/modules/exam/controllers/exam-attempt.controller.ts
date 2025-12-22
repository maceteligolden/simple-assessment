import { injectable, inject } from 'tsyringe'
import { Request, Response, NextFunction } from 'express'
import { ResponseUtil, parsePaginationParams } from '../../../shared/util'
import { HTTP_STATUS } from '../../../shared/constants'
import { logger } from '../../../shared/util/logger'
import {
  IExamAttemptService,
  StartExamInput,
  GetNextQuestionInput,
  SubmitAnswerInput,
  SubmitExamInput,
  GetAttemptResultsInput,
  GetMyResultsInput,
  IExamAttemptController,
} from '../interfaces/attempt.interface'

/**
 * Exam Attempt Controller Implementation
 * Handles HTTP requests for exam attempts (taking exams)
 */
@injectable()
export class ExamAttemptController implements IExamAttemptController {
  constructor(
    @inject('IExamAttemptService')
    private readonly attemptService: IExamAttemptService
  ) {
    logger.debug('ExamAttemptController initialized')
  }

  async startExam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract access code from request body
      const input: StartExamInput = {
        accessCode: req.body.accessCode,
      }

      const result = await this.attemptService.startExam(input, req.user.userId)

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Exam started successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async getNextQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract attempt ID from params
      const input: GetNextQuestionInput = {
        attemptId: req.params.attemptId,
      }

      const result = await this.attemptService.getNextQuestion(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }

  async submitAnswer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request
      const input: SubmitAnswerInput = {
        attemptId: req.params.attemptId,
        questionId: req.params.questionId,
        answer: req.body.answer,
      }

      const result = await this.attemptService.submitAnswer(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Answer saved successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async submitExam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract attempt ID from params
      const input: SubmitExamInput = {
        attemptId: req.params.attemptId,
      }

      const result = await this.attemptService.submitExam(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Exam submitted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async getAttemptResults(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract attempt ID from params
      const input: GetAttemptResultsInput = {
        attemptId: req.params.attemptId,
      }

      const result = await this.attemptService.getAttemptResults(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Results retrieved successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async getMyResults(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request and parse pagination
      const paginationParams = parsePaginationParams(req.query)
      const input: GetMyResultsInput = {
        pagination: paginationParams,
      }

      const result = await this.attemptService.getMyResults(
        input,
        req.user.userId
      )

      ResponseUtil.paginated(
        res,
        result.data,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        {
          message: 'Results retrieved successfully',
        }
      )
    } catch (error) {
      next(error)
    }
  }
}
