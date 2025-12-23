import { injectable, inject } from 'tsyringe'
import {
  IExamRepository,
  IQuestionRepository,
  IExamParticipantRepository,
} from '../../../shared/repository'
import { QuestionFactory } from '../factory/question.factory'
import { logger, paginateArray } from '../../../shared/util'
import { EXAM_ATTEMPT_STATUS } from '../../../shared/constants'
import {
  CreateExamInput,
  CreateExamOutput,
  ListExamsInput,
  ListExamsOutput,
  GetExamInput,
  GetExamOutput,
  UpdateExamInput,
  UpdateExamOutput,
  DeleteExamInput,
  DeleteExamOutput,
  GetExamResultsInput,
  GetExamResultsOutput,
  GetExamByCodeInput,
  GetExamByCodeOutput,
  IExamService,
} from '../interfaces/exam.interface'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from '../../../shared/errors'
import {
  IExam,
  IQuestion,
  IExamParticipant,
  IExamAttempt,
} from '../../../shared/model'

/**
 * Exam Service Implementation
 * Handles only exam CRUD operations and exam results viewing
 */
@injectable()
export class ExamService implements IExamService {
  constructor(
    @inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    @inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @inject('IExamParticipantRepository')
    private readonly participantRepository: IExamParticipantRepository
  ) {
    logger.debug('ExamService initialized')
  }

  /**
   * Create a new exam
   */
  async createExam(
    data: CreateExamInput,
    userId: string
  ): Promise<CreateExamOutput> {
    try {
      logger.info('[Create Exam Service] Starting exam creation', {
        userId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        availableAnytime: data.availableAnytime,
        randomizeQuestions: data.randomizeQuestions,
        startDate: data.startDate,
        endDate: data.endDate,
        showResultsImmediately: data.showResultsImmediately,
      })

      logger.debug('[Create Exam Service] Preparing exam data for repository', {
        userId,
        examData: {
          title: data.title,
          description: data.description,
          duration: data.duration,
          availableAnytime: data.availableAnytime,
          randomizeQuestions: data.randomizeQuestions,
          startDate: data.startDate
            ? new Date(data.startDate).toISOString()
            : undefined,
          endDate: data.endDate
            ? new Date(data.endDate).toISOString()
            : undefined,
          showResultsImmediately: data.showResultsImmediately,
        },
      })

      const exam = await this.examRepository.create({
        ...data,
        creatorId: userId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      })

      // Ensure _id is converted to string
      const examIdString = exam._id.toString()

      logger.info(
        '[Create Exam Service] Exam created successfully in database',
        {
          examId: examIdString,
          examIdType: typeof examIdString,
          examIdLength: examIdString.length,
          title: exam.title,
          duration: exam.duration,
          availableAnytime: exam.availableAnytime,
          randomizeQuestions: exam.randomizeQuestions,
          createdAt: exam.createdAt.toISOString(),
        }
      )

      // Validate examId is a non-empty string
      if (
        typeof examIdString !== 'string' ||
        examIdString.trim().length === 0
      ) {
        logger.error('[Create Exam Service] Invalid exam ID format', {
          examId: examIdString,
          examIdType: typeof examIdString,
          examIdValue: examIdString,
        })
        throw new Error('Failed to generate valid exam ID')
      }

      const responseData = {
        id: examIdString, // Ensure it's a string
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        availableAnytime: exam.availableAnytime,
        randomizeQuestions: exam.randomizeQuestions,
        passPercentage: exam.passPercentage,
        createdAt: exam.createdAt.toISOString(),
      }

      logger.debug('[Create Exam Service] Preparing response data', {
        examId: responseData.id,
        examIdType: typeof responseData.id,
        examIdLength: responseData.id.length,
        responseDataKeys: Object.keys(responseData),
        responseData,
      })

      // Final validation before returning
      if (
        typeof responseData.id !== 'string' ||
        responseData.id.trim().length === 0
      ) {
        logger.error('[Create Exam Service] Response data has invalid id', {
          responseData,
          idType: typeof responseData.id,
          idValue: responseData.id,
        })
        throw new Error('Response data contains invalid exam ID')
      }

      return responseData
    } catch (error) {
      logger.error('[Create Exam Service] Error creating exam', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        examTitle: data.title,
      })
      throw error
    }
  }

  /**
   * List exams created by user
   */
  async listExams(
    data: ListExamsInput,
    userId: string
  ): Promise<ListExamsOutput> {
    try {
      logger.debug('Listing exams', { userId })

      // Use pagination from input
      const { pagination, search, isActive } = data

      const exams = await this.examRepository.findByCreatorId(userId, {
        search,
        isActive,
      })

      // Get question and participant counts
      const examsWithCounts = await Promise.all(
        exams.map(async (exam: IExam) => {
          const questions = await this.questionRepository.findByExamId(
            exam._id.toString()
          )
          const participants = await this.participantRepository.findByExamId(
            exam._id.toString()
          )

          return {
            id: exam._id.toString(),
            title: exam.title,
            description: exam.description,
            duration: exam.duration,
            questionCount: questions.length,
            participantCount: participants.length,
            createdAt: exam.createdAt.toISOString(),
          }
        })
      )

      // Paginate the results
      const paginatedResult = paginateArray(examsWithCounts, pagination)

      return {
        data: paginatedResult.data,
        pagination: paginatedResult.pagination,
      }
    } catch (error) {
      logger.error('Error listing exams', error)
      throw error
    }
  }

  /**
   * Get exam details
   */
  async getExam(data: GetExamInput, userId: string): Promise<GetExamOutput> {
    try {
      logger.debug('Getting exam', { examId: data.examId, userId })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      // Compare both as strings to ensure proper comparison
      const creatorIdStr = exam.creatorId.toString()
      const userIdStr = userId.toString()
      
      if (creatorIdStr !== userIdStr) {
        logger.warn('Access denied: User is not the exam creator', {
          examId: data.examId,
          creatorId: creatorIdStr,
          userId: userIdStr,
        })
        throw new ForbiddenError('You do not have permission to view this exam')
      }

      // Get questions
      const questions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )

      // Get participants
      const participants = await this.participantRepository.findByExamId(
        exam._id.toString()
      )

      return {
        id: exam._id.toString(),
        creatorId: creatorIdStr, // Include creatorId in response for frontend
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        availableAnytime: exam.availableAnytime,
        startDate: exam.startDate?.toISOString(),
        endDate: exam.endDate?.toISOString(),
        randomizeQuestions: exam.randomizeQuestions,
        showResultsImmediately: exam.showResultsImmediately,
        passPercentage: exam.passPercentage,
        questions: questions.map((q: IQuestion) => {
          // Use factory to render question (excludes sensitive data)
          const questionHandler = QuestionFactory.create(q.type)
          return questionHandler.render(q)
        }),
        participants: participants.map((p: IExamParticipant) => ({
          id: p._id.toString(),
          email: p.email,
          accessCode: p.accessCode,
          isUsed: p.isUsed,
          addedAt: p.addedAt.toISOString(),
        })),
        createdAt: exam.createdAt.toISOString(),
        updatedAt: exam.updatedAt.toISOString(),
      }
    } catch (error) {
      logger.error('Error getting exam', error)
      throw error
    }
  }

  /**
   * Update exam
   */
  async updateExam(
    data: UpdateExamInput,
    userId: string
  ): Promise<UpdateExamOutput> {
    try {
      logger.info('Updating exam', { examId: data.examId, userId })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to update this exam'
        )
      }

      // Check if participants have started (for passPercentage edit restriction)
      const hasAttempts = await this.examRepository.hasActiveAttempts(
        exam._id.toString()
      )

      // Prepare update data
      const updateData: Partial<IExam> = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined)
        updateData.description = data.description
      if (data.duration !== undefined) updateData.duration = data.duration
      if (data.availableAnytime !== undefined)
        updateData.availableAnytime = data.availableAnytime
      if (data.startDate !== undefined)
        updateData.startDate = new Date(data.startDate)
      if (data.endDate !== undefined)
        updateData.endDate = new Date(data.endDate)
      if (data.randomizeQuestions !== undefined)
        updateData.randomizeQuestions = data.randomizeQuestions
      if (data.showResultsImmediately !== undefined)
        updateData.showResultsImmediately = data.showResultsImmediately
      
      // Check if passPercentage is being changed
      if (data.passPercentage !== undefined) {
        // If participants have started, prevent passPercentage edit
        if (hasAttempts) {
          throw new BadRequestError(
            'Cannot edit pass percentage. Participants have already started this exam.'
          )
        }
        updateData.passPercentage = data.passPercentage
      }

      const updatedExam = await this.examRepository.updateById(
        exam._id.toString(),
        updateData
      )

      if (!updatedExam) {
        throw new InternalServerError('Failed to update exam')
      }

      logger.info('Exam updated successfully', {
        examId: updatedExam._id.toString(),
      })

      return {
        id: updatedExam._id.toString(),
        title: updatedExam.title,
        description: updatedExam.description,
        duration: updatedExam.duration,
        updatedAt: updatedExam.updatedAt.toISOString(),
      }
    } catch (error) {
      logger.error('Error updating exam', error)
      throw error
    }
  }

  /**
   * Delete exam (soft delete)
   */
  async deleteExam(
    data: DeleteExamInput,
    userId: string
  ): Promise<DeleteExamOutput> {
    try {
      logger.info('Deleting exam', { examId: data.examId, userId })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to delete this exam'
        )
      }

      const deleted = await this.examRepository.deleteById(exam._id.toString())

      if (!deleted) {
        throw new InternalServerError('Failed to delete exam')
      }

      logger.info('Exam deleted successfully', { examId: exam._id.toString() })

      return {
        message: 'Exam deleted successfully',
      }
    } catch (error) {
      logger.error('Error deleting exam', error)
      throw error
    }
  }

  /**
   * Get exam results (for examiner)
   */
  async getExamResults(
    data: GetExamResultsInput,
    userId: string
  ): Promise<GetExamResultsOutput> {
    try {
      logger.debug('Getting exam results', { examId: data.examId, userId })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to view results for this exam'
        )
      }

      // Get all attempts for this exam
      const { ExamAttempt } = await import('../../../shared/model')
      const attempts = await ExamAttempt.find({
        examId: exam._id,
        status: EXAM_ATTEMPT_STATUS.SUBMITTED,
      })
        .populate('userId', 'email')
        .sort({ submittedAt: -1 })

      const results = attempts.map((attempt: IExamAttempt) => {
        const percentage = attempt.percentage || 0
        const passed = percentage >= exam.passPercentage
        return {
          attemptId: attempt._id.toString(),
          participantEmail: (attempt.userId as any).email,
          score: attempt.score || 0,
          maxScore: attempt.maxScore || 0,
          percentage,
          passed,
          passPercentage: exam.passPercentage,
          submittedAt: attempt.submittedAt!.toISOString(),
          status: attempt.status,
        }
      })

      return results
    } catch (error) {
      logger.error('Error getting exam results', error)
      throw error
    }
  }

  /**
   * Get exam by access code (for participants to view exam details)
   */
  async getExamByCode(
    data: GetExamByCodeInput,
    userId: string
  ): Promise<GetExamByCodeOutput> {
    try {
      logger.info('Getting exam by access code', {
        accessCode: data.accessCode,
        userId,
      })

      // Find participant by access code
      const participant = await this.participantRepository.findByAccessCode(
        data.accessCode
      )

      if (!participant) {
        throw new NotFoundError('Invalid access code')
      }

      // Verify user matches participant
      if (participant.userId.toString() !== userId) {
        throw new ForbiddenError('This access code does not belong to you')
      }

      // Get exam
      const exam = await this.examRepository.findById(
        participant.examId.toString()
      )

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Get questions
      const questions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )

      // Use factory to render questions (excludes sensitive data like correct answers)
      const renderedQuestions = questions.map((q: IQuestion) => {
        const questionHandler = QuestionFactory.create(q.type)
        return questionHandler.render(q)
      })

      return {
        id: exam._id.toString(),
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        availableAnytime: exam.availableAnytime,
        startDate: exam.startDate?.toISOString(),
        endDate: exam.endDate?.toISOString(),
        randomizeQuestions: exam.randomizeQuestions,
        passPercentage: exam.passPercentage,
        questions: renderedQuestions,
        totalQuestions: questions.length,
        participantId: participant._id.toString(),
        accessCode: participant.accessCode,
      }
    } catch (error) {
      logger.error('Error getting exam by access code', error)
      throw error
    }
  }
}
