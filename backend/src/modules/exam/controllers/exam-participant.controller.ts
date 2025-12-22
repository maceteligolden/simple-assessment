import { injectable, inject } from 'tsyringe'
import { Request, Response, NextFunction } from 'express'
import { ResponseUtil, parsePaginationParams } from '../../../shared/util'
import { HTTP_STATUS } from '../../../shared/constants'
import { logger } from '../../../shared/util/logger'
import {
  IExamParticipantService,
  AddParticipantInput,
  RemoveParticipantInput,
  ListParticipantsInput,
  GetParticipantResultInput,
  GetMyExamsInput,
  IExamParticipantController,
} from '../interfaces/participant.interface'

/**
 * Exam Participant Controller Implementation
 * Handles HTTP requests for participant management
 */
@injectable()
export class ExamParticipantController implements IExamParticipantController {
  constructor(
    @inject('IExamParticipantService')
    private readonly participantService: IExamParticipantService
  ) {
    logger.debug('ExamParticipantController initialized')
  }

  async addParticipant(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request
      const input: AddParticipantInput = {
        examId: req.params.id,
        email: req.body.email,
      }

      const result = await this.participantService.addParticipant(
        input,
        req.user.userId
      )

      ResponseUtil.created(res, result, {
        message: 'Participant added successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async removeParticipant(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request
      const input: RemoveParticipantInput = {
        examId: req.params.id,
        participantId: req.params.participantId,
      }

      const result = await this.participantService.removeParticipant(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Participant removed successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async listParticipants(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request and parse pagination
      const paginationParams = parsePaginationParams(req.query)
      const input: ListParticipantsInput = {
        examId: req.params.id,
        pagination: paginationParams,
        search: req.query.search as string | undefined,
      }

      const result = await this.participantService.listParticipants(
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
          message: 'Participants retrieved successfully',
        }
      )
    } catch (error) {
      next(error)
    }
  }

  async getParticipantResult(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.participantService.getParticipantResult(
        req as unknown as GetParticipantResultInput,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }

  async getMyExams(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request and parse pagination
      const paginationParams = parsePaginationParams(req.query)
      const input: GetMyExamsInput = {
        pagination: paginationParams,
        search: req.query.search as string | undefined,
        status: req.query.status as
          | 'not_started'
          | 'in-progress'
          | 'completed'
          | 'abandoned'
          | undefined,
        isAvailable:
          req.query.isAvailable !== undefined
            ? req.query.isAvailable === 'true'
            : undefined,
      }

      const result = await this.participantService.getMyExams(
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
          message: 'Exams retrieved successfully',
        }
      )
    } catch (error) {
      next(error)
    }
  }

  async getMyNotStartedExams(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request and parse pagination
      const paginationParams = parsePaginationParams(req.query)
      const input: GetMyExamsInput = {
        pagination: paginationParams,
        search: req.query.search as string | undefined,
        status: 'not_started', // Always filter for not_started
        isAvailable:
          req.query.isAvailable !== undefined
            ? req.query.isAvailable === 'true'
            : undefined,
      }

      const result = await this.participantService.getMyExams(
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
          message: 'Not-started exams retrieved successfully',
        }
      )
    } catch (error) {
      next(error)
    }
  }
}
