import { injectable, inject } from 'tsyringe'
import { IExamRepository } from '../../../shared/repository/exam.repository'
import { IQuestionRepository } from '../../../shared/repository/question.repository'
import { IExamCacheService } from '../cache'
import { QuestionFactory } from '../factory/question.factory'
import { QuestionType, IQuestion } from '../../../shared/model/question.model'
import { logger, TransactionManager, Sanitizer } from '../../../shared/util'
import {
  AddQuestionInput,
  AddQuestionOutput,
  UpdateQuestionInput,
  UpdateQuestionOutput,
  DeleteQuestionInput,
  DeleteQuestionOutput,
  IQuestionService,
} from '../interfaces/question.interface'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
  OptimisticLockError,
  ConflictError,
} from '../../../shared/errors'

/**
 * Question Service Implementation
 * Handles all business logic related to exam questions
 */
@injectable()
export class QuestionService implements IQuestionService {
  constructor(
    @inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    @inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @inject('IExamCacheService')
    private readonly examCache: IExamCacheService
  ) {
    logger.debug('QuestionService initialized')
  }

  /**
   * Add question to exam
   */
  async addQuestion(
    data: AddQuestionInput,
    userId: string
  ): Promise<AddQuestionOutput> {
    try {
      logger.info('Adding question to exam', {
        examId: data.examId,
        userId,
      })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to add questions to this exam'
        )
      }

      // Check if exam has active attempts
      const hasAttempts = await this.examRepository.hasActiveAttempts(
        exam._id.toString()
      )
      if (hasAttempts) {
        throw new BadRequestError(
          'Cannot add questions to exam that has active attempts'
        )
      }

      // Get current questions to determine next order
      // Use max order + 1 to handle concurrent requests safely
      const existingQuestions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )
      // Find the maximum order value, or use -1 if no questions exist
      const maxOrder =
        existingQuestions.length > 0
          ? Math.max(...existingQuestions.map((q: IQuestion) => q.order))
          : -1
      const nextOrder = maxOrder + 1

      // Sanitize question data
      const sanitizedQuestion = Sanitizer.sanitizeObject(data.question)
      const sanitizedOptions = data.options
        ? data.options.map(opt => Sanitizer.sanitize(opt))
        : undefined
      const sanitizedCorrectAnswer = Sanitizer.sanitizeObject(data.correctAnswer)

      // Create question using factory (validates and structures the data)
      let structuredQuestion
      try {
        structuredQuestion = QuestionFactory.createQuestion({
          type: data.type as QuestionType,
          question: sanitizedQuestion,
          options: sanitizedOptions,
          correctAnswer: sanitizedCorrectAnswer,
          points: data.points,
          order: nextOrder,
        })
      } catch (error) {
        logger.warn('Question creation failed', {
          error: error instanceof Error ? error.message : String(error),
          type: data.type,
        })
        throw new BadRequestError(
          error instanceof Error ? error.message : 'Invalid question data'
        )
      }

      // Use transaction to ensure atomicity: create question + add to exam
      const question = await TransactionManager.withTransaction(
        async session => {
          // 1. Create question in database (with session)
          const createdQuestion = await this.questionRepository.create(
            {
              examId: exam._id.toString(),
              type: structuredQuestion.type,
              question: structuredQuestion.question,
              options: structuredQuestion.options,
              correctAnswer: structuredQuestion.correctAnswer,
              points: structuredQuestion.points,
              order: structuredQuestion.order,
            },
            { session }
          )

          // 2. Add question to exam (with session)
          await this.examRepository.addQuestion(
            exam._id.toString(),
            createdQuestion._id.toString(),
            { session }
          )

          return createdQuestion
        }
      )

      logger.info('Question added successfully', {
        questionId: question._id.toString(),
        examId: exam._id.toString(),
      })

      // Invalidate exam cache
      await this.examCache.invalidateExam(exam._id.toString())

      // Render question using factory (excludes sensitive data like correctAnswer)
      const questionHandler = QuestionFactory.create(question.type)
      const renderedQuestion = questionHandler.render(question)

      // Add version for optimistic locking
      return {
        ...renderedQuestion,
        version: question.version,
      }
    } catch (error) {
      logger.error('Error adding question', error)
      throw error
    }
  }

  /**
   * Update question
   */
  async updateQuestion(
    data: UpdateQuestionInput,
    userId: string
  ): Promise<UpdateQuestionOutput> {
    try {
      logger.info('Updating question', {
        examId: data.examId,
        questionId: data.questionId,
        userId,
      })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to update questions in this exam'
        )
      }

      // Check if exam has active attempts
      const hasAttempts = await this.examRepository.hasActiveAttempts(
        exam._id.toString()
      )
      if (hasAttempts) {
        throw new BadRequestError(
          'Cannot update questions in exam that has active attempts'
        )
      }

      const question = await this.questionRepository.findById(
        data.questionId
      )

      if (!question) {
        throw new NotFoundError('Question not found')
      }

      // Verify question belongs to exam
      if (question.examId.toString() !== exam._id.toString()) {
        throw new BadRequestError('Question does not belong to this exam')
      }

      // Prepare update data
      const updateData: Partial<IQuestion> = {}
      if (data.question !== undefined) {
        updateData.question = Sanitizer.sanitizeObject(data.question)
      }
      if (data.options !== undefined) {
        updateData.options = data.options.map(opt => Sanitizer.sanitize(opt))
      }
      if (data.correctAnswer !== undefined) {
        updateData.correctAnswer = Sanitizer.sanitizeObject(data.correctAnswer)
      }
      if (data.points !== undefined) updateData.points = data.points

      // Validate and structure updated question if any question-related fields are being updated
      if (
        updateData.question !== undefined ||
        updateData.options !== undefined ||
        updateData.correctAnswer !== undefined
      ) {
        // Merge existing question with updates
        const mergedQuestion = {
          type: question.type,
          question:
            updateData.question !== undefined
              ? updateData.question
              : question.question,
          options:
            updateData.options !== undefined
              ? updateData.options
              : question.options,
          correctAnswer:
            updateData.correctAnswer !== undefined
              ? updateData.correctAnswer
              : question.correctAnswer,
          points:
            updateData.points !== undefined
              ? updateData.points
              : question.points,
          order: question.order,
        }

        try {
          // Use factory to create/validate the updated question structure
          const structuredQuestion =
            QuestionFactory.createQuestion(mergedQuestion)

          // Update with normalized data
          updateData.question = structuredQuestion.question
          updateData.options = structuredQuestion.options
          updateData.correctAnswer = structuredQuestion.correctAnswer
          if (data.points !== undefined) {
            updateData.points = structuredQuestion.points
          }
        } catch (error) {
          logger.warn('Question validation failed during update', {
            error: error instanceof Error ? error.message : String(error),
            type: question.type,
          })
          throw new BadRequestError(
            error instanceof Error
              ? error.message
              : 'Invalid question structure'
          )
        }
      }

      // Get version from input if provided (for optimistic locking)
      const expectedVersion = data.version

      try {
        const updatedQuestion = await this.questionRepository.updateById(
          question._id.toString(),
          updateData,
          { expectedVersion }
        )

        if (!updatedQuestion) {
          throw new InternalServerError('Failed to update question')
        }

        logger.info('Question updated successfully', {
          questionId: updatedQuestion._id.toString(),
        })

        // Invalidate exam cache
        await this.examCache.invalidateExam(exam._id.toString())

        // Render question using factory (excludes sensitive data like correctAnswer)
        const questionHandler = QuestionFactory.create(updatedQuestion.type)
        const renderedQuestion = questionHandler.render(updatedQuestion)

        // Add version for optimistic locking
        return {
          ...renderedQuestion,
          version: updatedQuestion.version,
        }
      } catch (error) {
        // Handle optimistic lock conflicts
        if (error instanceof OptimisticLockError) {
          logger.warn('Optimistic lock conflict during question update', {
            questionId: data.questionId,
            currentVersion: error.currentVersion,
            expectedVersion: error.expectedVersion,
          })
          throw new ConflictError(
            'Question was modified by another user. Please refresh and try again.'
          )
        }
        throw error
      }
    } catch (error) {
      logger.error('Error updating question', error)
      throw error
    }
  }

  /**
   * Delete question
   */
  async deleteQuestion(
    data: DeleteQuestionInput,
    userId: string
  ): Promise<DeleteQuestionOutput> {
    try {
      logger.info('Deleting question', {
        examId: data.examId,
        questionId: data.questionId,
        userId,
      })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to delete questions from this exam'
        )
      }

      // Check if exam has active attempts
      const hasAttempts = await this.examRepository.hasActiveAttempts(
        exam._id.toString()
      )
      if (hasAttempts) {
        throw new BadRequestError(
          'Cannot delete questions from exam that has active attempts'
        )
      }

      const question = await this.questionRepository.findById(
        data.questionId
      )

      if (!question) {
        throw new NotFoundError('Question not found')
      }

      // Verify question belongs to exam
      if (question.examId.toString() !== exam._id.toString()) {
        throw new BadRequestError('Question does not belong to this exam')
      }

      // Use transaction to ensure atomicity: remove from exam + delete question
      await TransactionManager.withTransaction(async session => {
        // 1. Remove question from exam (with session)
        await this.examRepository.removeQuestion(
          exam._id.toString(),
          question._id.toString(),
          { session }
        )

        // 2. Delete question (with session)
        await this.questionRepository.deleteById(question._id.toString(), {
          session,
        })
      })

      logger.info('Question deleted successfully', {
        questionId: question._id.toString(),
      })

      // Invalidate exam cache
      await this.examCache.invalidateExam(exam._id.toString())

      return {
        message: 'Question deleted successfully',
      }
    } catch (error) {
      logger.error('Error deleting question', error)
      throw error
    }
  }
}
