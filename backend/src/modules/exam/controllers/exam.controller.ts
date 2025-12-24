import { injectable, inject } from 'tsyringe'
import { Request, Response, NextFunction } from 'express'
import { ResponseUtil, parsePaginationParams } from '../../../shared/util'
import { HTTP_STATUS } from '../../../shared/constants'
import { logger } from '../../../shared/util/logger'
import {
  IExamService,
  CreateExamInput,
  ListExamsInput,
  GetExamInput,
  UpdateExamInput,
  DeleteExamInput,
  GetExamResultsInput,
  GetExamByCodeInput,
  IExamController,
} from '../interfaces/exam.interface'

/**
 * Exam Controller Implementation
 * Handles only exam CRUD operations
 */
@injectable()
export class ExamController implements IExamController {
  constructor(
    @inject('IExamService')
    private readonly examService: IExamService
  ) {
    logger.debug('ExamController initialized')
  }

  async createExam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('[Create Exam Controller] Request received', {
        userId: req.user.userId,
        hasUser: !!req.user,
        body: req.body,
        method: req.method,
        path: req.path,
      })

      logger.debug('[Create Exam Controller] Calling exam service', {
        userId: req.user.userId,
        examTitle: req.body?.title,
        examDuration: req.body?.duration,
      })

      // Extract fields from request body
      const input: CreateExamInput = {
        title: req.body.title,
        description: req.body.description,
        duration: req.body.duration,
        availableAnytime: req.body.availableAnytime,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        randomizeQuestions: req.body.randomizeQuestions,
        showResultsImmediately: req.body.showResultsImmediately,
        passPercentage: req.body.passPercentage,
      }

      const result = await this.examService.createExam(input, req.user.userId)

      // Validate result structure and id format
      if (!result) {
        logger.error('[Create Exam Controller] Invalid service response', {
          result,
        })
        throw new Error('Invalid response from exam service')
      }

      if (
        !result.id ||
        typeof result.id !== 'string' ||
        result.id.trim().length === 0
      ) {
        logger.error('[Create Exam Controller] Invalid exam ID in response', {
          resultData: result,
          idValue: result.id,
          idType: typeof result.id,
        })
        throw new Error('Invalid exam ID in service response')
      }

      logger.info('[Create Exam Controller] Exam created successfully', {
        userId: req.user.userId,
        examId: result.id,
        examIdType: typeof result.id,
        examIdLength: result.id.length,
        examTitle: result.title,
        responseDataKeys: Object.keys(result),
      })

      ResponseUtil.created(res, result, {
        message: 'Exam created successfully',
      })
    } catch (error) {
      logger.error('[Create Exam Controller] Error creating exam', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.userId,
      })
      next(error)
    }
  }

  async listExams(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from query and parse pagination
      const paginationParams = parsePaginationParams(req.query)
      const input: ListExamsInput = {
        pagination: paginationParams,
        search: req.query.search as string | undefined,
        isActive: req.query.isActive
          ? req.query.isActive === 'true'
          : undefined,
      }

      const result = await this.examService.listExams(input, req.user.userId)

      ResponseUtil.paginated(
        res,
        result.data,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        {
          message: 'Exams retrieved successfully',
        }
      )
    } catch (error) {
      next(error)
    }
  }

  async getExam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract exam ID from params
      const input: GetExamInput = {
        examId: req.params.id,
      }

      const result = await this.examService.getExam(input, req.user.userId)

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Exam retrieved successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async updateExam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request
      const input: UpdateExamInput = {
        examId: req.params.id,
        title: req.body.title,
        description: req.body.description,
        duration: req.body.duration,
        availableAnytime: req.body.availableAnytime,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        randomizeQuestions: req.body.randomizeQuestions,
        showResultsImmediately: req.body.showResultsImmediately,
      }

      const result = await this.examService.updateExam(input, req.user.userId)

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Exam updated successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteExam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract exam ID from params
      const input: DeleteExamInput = {
        examId: req.params.id,
      }

      const result = await this.examService.deleteExam(input, req.user.userId)

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Exam deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async getExamResults(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract exam ID from params and parse pagination
      const paginationParams = parsePaginationParams(req.query)
      const input: GetExamResultsInput = {
        examId: req.params.id,
        pagination: paginationParams,
      }

      const result = await this.examService.getExamResults(
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
          message: 'Exam results retrieved successfully',
        }
      )
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get exam by access code
   * Allows participants to view exam details before starting
   */
  async getExamByCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract access code from params
      const input: GetExamByCodeInput = {
        accessCode: req.params.code,
      }

      const result = await this.examService.getExamByCode(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Exam retrieved successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}
