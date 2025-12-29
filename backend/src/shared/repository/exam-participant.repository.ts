import { injectable } from 'tsyringe'
import {
  IExamParticipant,
  ExamParticipant,
} from '../model/exam-participant.model'
import { logger } from '../util/logger'
import { Types, ClientSession } from 'mongoose'
import { EXAM_ATTEMPT_STATUS } from '../constants'
import { RepositoryOptions } from '../interfaces'

/**
 * Exam Participant Repository Interface
 */
export interface IExamParticipantRepository {
  create(
    data: {
      examId: string
      userId: string
      email: string
    },
    options?: RepositoryOptions
  ): Promise<IExamParticipant>
  findById(id: string, options?: RepositoryOptions): Promise<IExamParticipant | null>
  findByExamId(examId: string, options?: RepositoryOptions): Promise<IExamParticipant[]>
  findByUserId(userId: string, options?: RepositoryOptions): Promise<IExamParticipant[]>
  findByAccessCode(accessCode: string, options?: RepositoryOptions): Promise<IExamParticipant | null>
  findByExamAndUser(
    examId: string,
    userId: string,
    options?: RepositoryOptions
  ): Promise<IExamParticipant | null>
  markAsUsed(id: string, options?: RepositoryOptions): Promise<boolean>
  deleteById(id: string, options?: RepositoryOptions): Promise<boolean>
  hasStartedAttempt(participantId: string, options?: RepositoryOptions): Promise<boolean>
}

/**
 * Exam Participant Repository Implementation
 */
@injectable()
export class ExamParticipantRepository implements IExamParticipantRepository {
  async create(
    data: {
      examId: string
      userId: string
      email: string
    },
    options?: RepositoryOptions
  ): Promise<IExamParticipant> {
    try {
      logger.debug('Creating exam participant in repository', {
        examId: data.examId,
        email: data.email,
        hasSession: !!options?.session,
      })
      const participant = new ExamParticipant({
        ...data,
        examId: new Types.ObjectId(data.examId),
        userId: new Types.ObjectId(data.userId),
      })
      
      // Use session if provided (for transactions)
      if (options?.session) {
        await participant.save({ session: options.session })
      } else {
        await participant.save()
      }
      
      logger.debug('Exam participant created successfully', {
        participantId: participant._id.toString(),
        accessCode: participant.accessCode,
      })
      return participant
    } catch (error) {
      logger.error('Error creating exam participant in repository', error)
      throw error
    }
  }

  async findById(id: string): Promise<IExamParticipant | null> {
    try {
      logger.debug('Finding exam participant by ID in repository', {
        participantId: id,
      })
      const participant = await ExamParticipant.findById(id)
      return participant
    } catch (error) {
      logger.error('Error finding exam participant by ID in repository', error)
      throw error
    }
  }

  async findByExamId(examId: string, options?: RepositoryOptions): Promise<IExamParticipant[]> {
    try {
      logger.debug('Finding exam participants by exam ID in repository', {
        examId,
      })
      const query = ExamParticipant.find({
        examId: new Types.ObjectId(examId),
      })
        .select('_id email accessCode isUsed addedAt')
        .sort({ addedAt: -1 })
      
      if (options?.session) {
        query.session(options.session)
      }
      
      const participants = await query
      return participants
    } catch (error) {
      logger.error(
        'Error finding exam participants by exam ID in repository',
        error
      )
      throw error
    }
  }

  async findByUserId(userId: string, options?: RepositoryOptions): Promise<IExamParticipant[]> {
    try {
      logger.debug('Finding exam participants by user ID in repository', {
        userId,
      })
      const query = ExamParticipant.find({
        userId: new Types.ObjectId(userId),
      })
        .select('_id examId accessCode addedAt')
        .sort({ addedAt: -1 })
      
      if (options?.session) {
        query.session(options.session)
      }
      
      const participants = await query
      return participants
    } catch (error) {
      logger.error(
        'Error finding exam participants by user ID in repository',
        error
      )
      throw error
    }
  }

  async findByAccessCode(accessCode: string): Promise<IExamParticipant | null> {
    try {
      logger.debug('Finding exam participant by access code in repository')
      const participant = await ExamParticipant.findOne({
        accessCode: accessCode.toUpperCase(),
      })
      return participant
    } catch (error) {
      logger.error(
        'Error finding exam participant by access code in repository',
        error
      )
      throw error
    }
  }

  async findByExamAndUser(
    examId: string,
    userId: string
  ): Promise<IExamParticipant | null> {
    try {
      logger.debug('Finding exam participant by exam and user in repository', {
        examId,
        userId,
      })
      const participant = await ExamParticipant.findOne({
        examId: new Types.ObjectId(examId),
        userId: new Types.ObjectId(userId),
      })
      return participant
    } catch (error) {
      logger.error(
        'Error finding exam participant by exam and user in repository',
        error
      )
      throw error
    }
  }

  async markAsUsed(id: string, options?: RepositoryOptions): Promise<boolean> {
    try {
      logger.debug('Marking exam participant as used in repository', {
        participantId: id,
        hasSession: !!options?.session,
      })
      const updateOptions: any = { new: true }
      if (options?.session) {
        updateOptions.session = options.session
      }
      
      const result = await ExamParticipant.findByIdAndUpdate(
        id,
        { isUsed: true },
        updateOptions
      )
      return !!result
    } catch (error) {
      logger.error(
        'Error marking exam participant as used in repository',
        error
      )
      throw error
    }
  }

  async deleteById(id: string, options?: RepositoryOptions): Promise<boolean> {
    try {
      logger.debug('Deleting exam participant in repository', {
        participantId: id,
        hasSession: !!options?.session,
      })
      const deleteOptions: any = {}
      if (options?.session) {
        deleteOptions.session = options.session
      }
      
      const result = await ExamParticipant.findByIdAndDelete(id, deleteOptions)
      return !!result
    } catch (error) {
      logger.error('Error deleting exam participant in repository', error)
      throw error
    }
  }

  async hasStartedAttempt(participantId: string): Promise<boolean> {
    try {
      logger.debug(
        'Checking if participant has started attempt in repository',
        {
          participantId,
        }
      )
      const { ExamAttempt } = await import('../model/exam-attempt.model')
      const count = await ExamAttempt.countDocuments({
        participantId: new Types.ObjectId(participantId),
        status: { $ne: EXAM_ATTEMPT_STATUS.NOT_STARTED },
      })
      return count > 0
    } catch (error) {
      logger.error(
        'Error checking if participant has started attempt in repository',
        error
      )
      throw error
    }
  }
}
