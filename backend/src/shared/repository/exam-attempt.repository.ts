import { injectable } from 'tsyringe'
import {
  IExamAttempt,
  ExamAttempt,
  AttemptStatus,
} from '../model/exam-attempt.model'
import { logger } from '../util/logger'
import { Types } from 'mongoose'
import { EXAM_ATTEMPT_STATUS } from '../constants'

/**
 * Exam Attempt Repository Interface
 */
export interface IExamAttemptRepository {
  create(data: {
    examId: string
    participantId: string
    userId: string
    questionOrder: number[]
  }): Promise<IExamAttempt>
  findById(id: string): Promise<IExamAttempt | null>
  findByExamAndUser(
    examId: string,
    userId: string
  ): Promise<IExamAttempt | null>
  findByParticipant(participantId: string): Promise<IExamAttempt | null>
  updateById(
    id: string,
    data: Partial<IExamAttempt>
  ): Promise<IExamAttempt | null>
  updateAnswer(
    attemptId: string,
    questionId: string,
    answer: string | string[]
  ): Promise<IExamAttempt | null>
  markAsAbandoned(id: string): Promise<boolean>
  updateActivity(id: string): Promise<IExamAttempt | null>
  findByUserId(userId: string): Promise<IExamAttempt[]>
}

/**
 * Exam Attempt Repository Implementation
 */
@injectable()
export class ExamAttemptRepository implements IExamAttemptRepository {
  async create(data: {
    examId: string
    participantId: string
    userId: string
    questionOrder: number[]
  }): Promise<IExamAttempt> {
    try {
      logger.debug('Creating exam attempt in repository', {
        examId: data.examId,
        userId: data.userId,
      })
      const attempt = new ExamAttempt({
        ...data,
        examId: new Types.ObjectId(data.examId),
        participantId: new Types.ObjectId(data.participantId),
        userId: new Types.ObjectId(data.userId),
        status: EXAM_ATTEMPT_STATUS.NOT_STARTED,
      })
      await attempt.save()
      logger.debug('Exam attempt created successfully', {
        attemptId: attempt._id.toString(),
      })
      return attempt
    } catch (error) {
      logger.error('Error creating exam attempt in repository', error)
      throw error
    }
  }

  async findById(id: string): Promise<IExamAttempt | null> {
    try {
      logger.debug('Finding exam attempt by ID in repository', {
        attemptId: id,
      })
      // Don't populate examId - we fetch the exam separately when needed
      // This prevents issues with toString() on populated objects
      const attempt = await ExamAttempt.findById(id)
      return attempt
    } catch (error) {
      logger.error('Error finding exam attempt by ID in repository', error)
      throw error
    }
  }

  async findByExamAndUser(
    examId: string,
    userId: string
  ): Promise<IExamAttempt | null> {
    try {
      logger.debug('Finding exam attempt by exam and user in repository', {
        examId,
        userId,
      })
      // Don't populate examId - we fetch the exam separately when needed
      const attempt = await ExamAttempt.findOne({
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
      })
      return attempt
    } catch (error) {
      logger.error(
        'Error finding exam attempt by exam and user in repository',
        error
      )
      throw error
    }
  }

  async findByParticipant(participantId: string): Promise<IExamAttempt | null> {
    try {
      logger.debug('Finding exam attempt by participant in repository', {
        participantId,
      })
      const attempt = await ExamAttempt.findOne({
        participantId: new Types.ObjectId(participantId),
      })
        .populate('examId')
        .populate('participantId')
      return attempt
    } catch (error) {
      logger.error(
        'Error finding exam attempt by participant in repository',
        error
      )
      throw error
    }
  }

  async updateById(
    id: string,
    data: Partial<IExamAttempt>
  ): Promise<IExamAttempt | null> {
    try {
      logger.debug('Updating exam attempt in repository', { attemptId: id })
      const attempt = await ExamAttempt.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
      return attempt
    } catch (error) {
      logger.error('Error updating exam attempt in repository', error)
      throw error
    }
  }

  async updateAnswer(
    attemptId: string,
    questionId: string,
    answer: string | string[]
  ): Promise<IExamAttempt | null> {
    try {
      logger.debug('Updating answer in exam attempt in repository', {
        attemptId,
        questionId,
      })
      const attempt = await ExamAttempt.findById(attemptId)
      if (!attempt) {
        return null
      }

      const now = new Date()
      const answerData = {
        answer,
        answeredAt: attempt.answers.get(questionId)?.answeredAt || now,
        updatedAt: now,
      }

      attempt.answers.set(questionId, answerData)

      // Update answeredQuestions - use currentQuestionIndex (position in questionOrder)
      // This represents which question in the sequence was answered
      const currentIndex = attempt.currentQuestionIndex
      if (!attempt.answeredQuestions.includes(currentIndex)) {
        attempt.answeredQuestions.push(currentIndex)
        attempt.answeredQuestions.sort((a, b) => a - b)
      }

      await attempt.save()
      return attempt
    } catch (error) {
      logger.error('Error updating answer in exam attempt in repository', error)
      throw error
    }
  }

  async markAsAbandoned(id: string): Promise<boolean> {
    try {
      logger.debug('Marking exam attempt as abandoned in repository', {
        attemptId: id,
      })
      const result = await ExamAttempt.findByIdAndUpdate(
        id,
        {
          status: EXAM_ATTEMPT_STATUS.ABANDONED,
          abandonedAt: new Date(),
        },
        { new: true }
      )
      return !!result
    } catch (error) {
      logger.error(
        'Error marking exam attempt as abandoned in repository',
        error
      )
      throw error
    }
  }

  async updateActivity(id: string): Promise<IExamAttempt | null> {
    try {
      logger.debug('Updating exam attempt activity in repository', {
        attemptId: id,
      })
      const attempt = await ExamAttempt.findByIdAndUpdate(
        id,
        { lastActivityAt: new Date() },
        { new: true }
      )
      return attempt
    } catch (error) {
      logger.error('Error updating exam attempt activity in repository', error)
      throw error
    }
  }

  async findByUserId(userId: string): Promise<IExamAttempt[]> {
    try {
      logger.debug('Finding exam attempts by user ID in repository', { userId })
      const attempts = await ExamAttempt.find({
        userId: new Types.ObjectId(userId),
      })
        .populate('examId')
        .sort({ createdAt: -1 })
      return attempts
    } catch (error) {
      logger.error(
        'Error finding exam attempts by user ID in repository',
        error
      )
      throw error
    }
  }
}
