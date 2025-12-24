import { injectable } from 'tsyringe'
import { IExam, Exam } from '../model/exam.model'
import { logger } from '../util/logger'
import { Types, ClientSession } from 'mongoose'
import { EXAM_ATTEMPT_STATUS } from '../constants'

/**
 * Repository options for operations that support transactions and optimistic locking
 */
export interface RepositoryOptions {
  session?: ClientSession
  expectedVersion?: number // For optimistic locking - expected version of the document
}

/**
 * Exam Repository Interface
 */
export interface IExamRepository {
  create(
    data: {
      title: string
      description?: string
      duration: number
      creatorId: string
      availableAnytime: boolean
      startDate?: Date
      endDate?: Date
      randomizeQuestions: boolean
      showResultsImmediately: boolean
      passPercentage: number
    },
    options?: RepositoryOptions
  ): Promise<IExam>
  findById(id: string, options?: RepositoryOptions): Promise<IExam | null>
  findByCreatorId(
    creatorId: string,
    filters?: {
      search?: string
      isActive?: boolean
    },
    options?: RepositoryOptions
  ): Promise<IExam[]>
  updateById(
    id: string,
    data: Partial<IExam>,
    options?: RepositoryOptions
  ): Promise<IExam | null>
  deleteById(id: string, options?: RepositoryOptions): Promise<boolean>
  addQuestion(
    examId: string,
    questionId: string,
    options?: RepositoryOptions
  ): Promise<IExam | null>
  removeQuestion(
    examId: string,
    questionId: string,
    options?: RepositoryOptions
  ): Promise<IExam | null>
  reorderQuestions(
    examId: string,
    questionIds: string[],
    options?: RepositoryOptions
  ): Promise<IExam | null>
  hasActiveAttempts(examId: string, options?: RepositoryOptions): Promise<boolean>
}

/**
 * Exam Repository Implementation
 */
@injectable()
export class ExamRepository implements IExamRepository {
  async create(data: {
    title: string
    description?: string
    duration: number
    creatorId: string
    availableAnytime: boolean
    startDate?: Date
    endDate?: Date
    randomizeQuestions: boolean
    showResultsImmediately: boolean
    passPercentage: number
  }): Promise<IExam> {
    try {
      logger.info('[Exam Repository] Creating exam', {
        title: data.title,
        creatorId: data.creatorId,
        duration: data.duration,
        availableAnytime: data.availableAnytime,
        randomizeQuestions: data.randomizeQuestions,
        startDate: data.startDate?.toISOString(),
        endDate: data.endDate?.toISOString(),
        showResultsImmediately: data.showResultsImmediately,
      })

      logger.debug('[Exam Repository] Instantiating Exam model', {
        dataKeys: Object.keys(data),
        hasDescription: !!data.description,
        hasStartDate: !!data.startDate,
        hasEndDate: !!data.endDate,
      })

      const exam = new Exam(data)

      // Get the ID as string immediately after creation
      const examIdString = exam._id.toString()

      // Validate ID is a valid string
      if (
        typeof examIdString !== 'string' ||
        examIdString.trim().length === 0
      ) {
        logger.error('[Exam Repository] Invalid exam ID generated', {
          examId: examIdString,
          examIdType: typeof examIdString,
          examIdValue: examIdString,
        })
        throw new Error('Failed to generate valid exam ID')
      }

      logger.debug('[Exam Repository] Saving exam to database', {
        examId: examIdString,
        examIdType: typeof examIdString,
        examIdLength: examIdString.length,
        title: exam.title,
      })

      await exam.save()

      // Verify ID is still valid after save
      const savedExamIdString = exam._id.toString()
      if (savedExamIdString !== examIdString) {
        logger.warn('[Exam Repository] Exam ID changed after save', {
          originalId: examIdString,
          savedId: savedExamIdString,
        })
      }

      logger.info('[Exam Repository] Exam saved successfully', {
        examId: savedExamIdString,
        examIdType: typeof savedExamIdString,
        examIdLength: savedExamIdString.length,
        title: exam.title,
        duration: exam.duration,
        createdAt: exam.createdAt.toISOString(),
        idConfirmed: true,
      })

      return exam
    } catch (error) {
      logger.error('[Exam Repository] Error creating exam', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        title: data.title,
        creatorId: data.creatorId,
      })
      throw error
    }
  }

  async findById(id: string): Promise<IExam | null> {
    try {
      logger.debug('Finding exam by ID in repository', { examId: id })
      const exam = await Exam.findOne({
        _id: id,
        isDeleted: false,
      }).populate('questions')
      return exam
    } catch (error) {
      logger.error('Error finding exam by ID in repository', error)
      throw error
    }
  }

  async findByCreatorId(
    creatorId: string,
    filters?: { search?: string; isActive?: boolean }
  ): Promise<IExam[]> {
    try {
      logger.debug('Finding exams by creator ID in repository', {
        creatorId,
        filters,
      })

      const query: Record<string, unknown> = {
        creatorId: new Types.ObjectId(creatorId),
        isDeleted: false,
      }

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive
      }

      if (filters?.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ]
      }

      const exams = await Exam.find(query)
        .sort({ createdAt: -1 })
        .populate('questions')

      return exams
    } catch (error) {
      logger.error('Error finding exams by creator ID in repository', error)
      throw error
    }
  }

  async updateById(
    id: string,
    data: Partial<IExam>,
    options?: RepositoryOptions
  ): Promise<IExam | null> {
    try {
      logger.debug('Updating exam in repository', {
        examId: id,
        hasSession: !!options?.session,
        expectedVersion: options?.expectedVersion,
      })

      // If expectedVersion is provided, validate it before updating
      if (options?.expectedVersion !== undefined) {
        const currentExam = await Exam.findById(id)
        if (!currentExam) {
          return null
        }

        if (currentExam.version !== options.expectedVersion) {
          const { OptimisticLockError } = await import('../errors')
          throw new OptimisticLockError(
            'Exam was modified by another user. Please refresh and try again.',
            currentExam.version,
            options.expectedVersion,
            { examId: id }
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

      const exam = await Exam.findByIdAndUpdate(id, data, updateOptions)
      return exam
    } catch (error) {
      // Re-throw OptimisticLockError as-is
      if (
        error instanceof Error &&
        (error.name === 'OptimisticLockError' ||
          error.constructor.name === 'OptimisticLockError')
      ) {
        throw error
      }
      logger.error('Error updating exam in repository', error)
      throw error
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      logger.debug('Soft deleting exam in repository', { examId: id })
      const result = await Exam.findByIdAndUpdate(
        id,
        { isDeleted: true, isActive: false },
        { new: true }
      )
      return !!result
    } catch (error) {
      logger.error('Error deleting exam in repository', error)
      throw error
    }
  }

  async addQuestion(
    examId: string,
    questionId: string,
    options?: RepositoryOptions
  ): Promise<IExam | null> {
    try {
      logger.debug('Adding question to exam in repository', {
        examId,
        questionId,
        hasSession: !!options?.session,
      })
      const updateOptions: any = { new: true }
      if (options?.session) {
        updateOptions.session = options.session
      }
      
      const exam = await Exam.findByIdAndUpdate(
        examId,
        { $addToSet: { questions: new Types.ObjectId(questionId) } },
        updateOptions
      )
      return exam
    } catch (error) {
      logger.error('Error adding question to exam in repository', error)
      throw error
    }
  }

  async removeQuestion(
    examId: string,
    questionId: string,
    options?: RepositoryOptions
  ): Promise<IExam | null> {
    try {
      logger.debug('Removing question from exam in repository', {
        examId,
        questionId,
        hasSession: !!options?.session,
      })
      const updateOptions: any = { new: true }
      if (options?.session) {
        updateOptions.session = options.session
      }
      
      const exam = await Exam.findByIdAndUpdate(
        examId,
        { $pull: { questions: new Types.ObjectId(questionId) } },
        updateOptions
      )
      return exam
    } catch (error) {
      logger.error('Error removing question from exam in repository', error)
      throw error
    }
  }

  async reorderQuestions(
    examId: string,
    questionIds: string[]
  ): Promise<IExam | null> {
    try {
      logger.debug('Reordering questions in exam in repository', {
        examId,
        questionIds,
      })
      const exam = await Exam.findByIdAndUpdate(
        examId,
        { questions: questionIds.map(id => new Types.ObjectId(id)) },
        { new: true }
      )
      return exam
    } catch (error) {
      logger.error('Error reordering questions in exam in repository', error)
      throw error
    }
  }

  async hasActiveAttempts(examId: string): Promise<boolean> {
    try {
      logger.debug('Checking for active attempts in repository', { examId })
      const { ExamAttempt } = await import('../model/exam-attempt.model')
      const count = await ExamAttempt.countDocuments({
        examId: new Types.ObjectId(examId),
        status: {
          $in: [
            EXAM_ATTEMPT_STATUS.IN_PROGRESS,
            EXAM_ATTEMPT_STATUS.SUBMITTED,
          ],
        },
      })
      return count > 0
    } catch (error) {
      logger.error('Error checking active attempts in repository', error)
      throw error
    }
  }
}
