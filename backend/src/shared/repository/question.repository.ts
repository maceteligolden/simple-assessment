import { injectable } from 'tsyringe'
import { IQuestion, Question } from '../model/question.model'
import { logger } from '../util/logger'
import { Types, ClientSession } from 'mongoose'

/**
 * Repository options for operations that support transactions and optimistic locking
 */
export interface RepositoryOptions {
  session?: ClientSession
  expectedVersion?: number // For optimistic locking - expected version of the document
}

/**
 * Question Repository Interface
 */
export interface IQuestionRepository {
  create(
    data: {
      examId: string
      type: string
      question: string | Record<string, unknown>
      options?: string[]
      correctAnswer: string | string[] | Record<string, unknown>
      points?: number
      order: number
    },
    options?: RepositoryOptions
  ): Promise<IQuestion>
  findById(id: string, options?: RepositoryOptions): Promise<IQuestion | null>
  findByExamId(examId: string, options?: RepositoryOptions): Promise<IQuestion[]>
  updateById(
    id: string,
    data: Partial<IQuestion>,
    options?: RepositoryOptions
  ): Promise<IQuestion | null>
  deleteById(id: string, options?: RepositoryOptions): Promise<boolean>
  updateOrder(
    examId: string,
    questionOrders: Array<{ id: string; order: number }>,
    options?: RepositoryOptions
  ): Promise<void>
}

/**
 * Question Repository Implementation
 */
@injectable()
export class QuestionRepository implements IQuestionRepository {
  async create(
    data: {
      examId: string
      type: string
      question: string | Record<string, unknown>
      options?: string[]
      correctAnswer: string | string[] | Record<string, unknown>
      points?: number
      order: number
    },
    options?: RepositoryOptions
  ): Promise<IQuestion> {
    try {
      logger.debug('Creating question in repository', {
        examId: data.examId,
        type: data.type,
        hasSession: !!options?.session,
      })
      const question = new Question({
        ...data,
        examId: new Types.ObjectId(data.examId),
        points: data.points ?? 1,
      })
      
      // Use session if provided (for transactions)
      if (options?.session) {
        await question.save({ session: options.session })
      } else {
        await question.save()
      }
      
      logger.debug('Question created successfully', {
        questionId: question._id.toString(),
      })
      return question
    } catch (error) {
      logger.error('Error creating question in repository', error)
      throw error
    }
  }

  async findById(id: string): Promise<IQuestion | null> {
    try {
      logger.debug('Finding question by ID in repository', { questionId: id })
      const question = await Question.findById(id)
      return question
    } catch (error) {
      logger.error('Error finding question by ID in repository', error)
      throw error
    }
  }

  async findByExamId(examId: string): Promise<IQuestion[]> {
    try {
      logger.debug('Finding questions by exam ID in repository', { examId })
      const questions = await Question.find({
        examId: new Types.ObjectId(examId),
      }).sort({ order: 1 })
      return questions
    } catch (error) {
      logger.error('Error finding questions by exam ID in repository', error)
      throw error
    }
  }

  async updateById(
    id: string,
    data: Partial<IQuestion>,
    options?: RepositoryOptions
  ): Promise<IQuestion | null> {
    try {
      logger.debug('Updating question in repository', {
        questionId: id,
        hasSession: !!options?.session,
        expectedVersion: options?.expectedVersion,
      })

      // If expectedVersion is provided, validate it before updating
      if (options?.expectedVersion !== undefined) {
        const currentQuestion = await Question.findById(id)
        if (!currentQuestion) {
          return null
        }

        if (currentQuestion.version !== options.expectedVersion) {
          const { OptimisticLockError } = await import('../errors')
          throw new OptimisticLockError(
            'Question was modified by another user. Please refresh and try again.',
            currentQuestion.version,
            options.expectedVersion,
            { questionId: id }
          )
        }
      }

      const updateOptions: {
        new: boolean
        runValidators: boolean
        session?: ClientSession
      } = {
        new: true,
        runValidators: true,
      }

      if (options?.session) {
        updateOptions.session = options.session
      }

      const question = await Question.findByIdAndUpdate(id, data, updateOptions)
      return question
    } catch (error) {
      // Re-throw OptimisticLockError as-is
      if (
        error instanceof Error &&
        (error.name === 'OptimisticLockError' ||
          error.constructor.name === 'OptimisticLockError')
      ) {
        throw error
      }
      logger.error('Error updating question in repository', error)
      throw error
    }
  }

  async deleteById(id: string, options?: RepositoryOptions): Promise<boolean> {
    try {
      logger.debug('Deleting question in repository', {
        questionId: id,
        hasSession: !!options?.session,
      })
      const deleteOptions: any = {}
      if (options?.session) {
        deleteOptions.session = options.session
      }
      
      const result = await Question.findByIdAndDelete(id, deleteOptions)
      return !!result
    } catch (error) {
      logger.error('Error deleting question in repository', error)
      throw error
    }
  }

  async updateOrder(
    examId: string,
    questionOrders: Array<{ id: string; order: number }>
  ): Promise<void> {
    try {
      logger.debug('Updating question orders in repository', {
        examId,
        questionOrders,
      })

      const bulkOps = questionOrders.map(({ id, order }) => ({
        updateOne: {
          filter: {
            _id: new Types.ObjectId(id),
            examId: new Types.ObjectId(examId),
          },
          update: { $set: { order } },
        },
      }))

      await Question.bulkWrite(bulkOps)
    } catch (error) {
      logger.error('Error updating question orders in repository', error)
      throw error
    }
  }
}
