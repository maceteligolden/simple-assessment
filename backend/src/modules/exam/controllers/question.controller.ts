import { injectable, inject } from 'tsyringe'
import { Request, Response, NextFunction } from 'express'
import { ResponseUtil } from '../../../shared/util/response'
import { HTTP_STATUS } from '../../../shared/constants'
import { logger } from '../../../shared/util/logger'
import {
  IQuestionService,
  AddQuestionInput,
  UpdateQuestionInput,
  DeleteQuestionInput,
  IQuestionController,
} from '../interfaces/question.interface'

/**
 * Question Controller Implementation
 * Handles HTTP requests for question management
 */
@injectable()
export class QuestionController implements IQuestionController {
  constructor(
    @inject('IQuestionService')
    private readonly questionService: IQuestionService
  ) {
    logger.debug('QuestionController initialized')
  }

  async addQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request
      const input: AddQuestionInput = {
        examId: req.params.id,
        type: req.body.type,
        question: req.body.question,
        options: req.body.options,
        correctAnswer: req.body.correctAnswer,
        points: req.body.points,
      }

      const result = await this.questionService.addQuestion(
        input,
        req.user.userId
      )

      ResponseUtil.created(res, result, {
        message: 'Question added successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async updateQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request
      const input: UpdateQuestionInput = {
        examId: req.params.id,
        questionId: req.params.questionId,
        question: req.body.question,
        options: req.body.options,
        correctAnswer: req.body.correctAnswer,
        points: req.body.points,
      }

      const result = await this.questionService.updateQuestion(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Question updated successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract fields from request
      const input: DeleteQuestionInput = {
        examId: req.params.id,
        questionId: req.params.questionId,
      }

      const result = await this.questionService.deleteQuestion(
        input,
        req.user.userId
      )

      ResponseUtil.success(res, result, HTTP_STATUS.OK, {
        message: 'Question deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}
