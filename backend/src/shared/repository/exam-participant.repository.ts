import { injectable } from 'tsyringe'
import {
  IExamParticipant,
  ExamParticipant,
} from '../model/exam-participant.model'
import { logger } from '../util/logger'
import { Types } from 'mongoose'

/**
 * Exam Participant Repository Interface
 */
export interface IExamParticipantRepository {
  create(data: {
    examId: string
    userId: string
    email: string
  }): Promise<IExamParticipant>
  findById(id: string): Promise<IExamParticipant | null>
  findByExamId(examId: string): Promise<IExamParticipant[]>
  findByUserId(userId: string): Promise<IExamParticipant[]>
  findByAccessCode(accessCode: string): Promise<IExamParticipant | null>
  findByExamAndUser(
    examId: string,
    userId: string
  ): Promise<IExamParticipant | null>
  markAsUsed(id: string): Promise<boolean>
  deleteById(id: string): Promise<boolean>
  hasStartedAttempt(participantId: string): Promise<boolean>
}

/**
 * Exam Participant Repository Implementation
 */
@injectable()
export class ExamParticipantRepository implements IExamParticipantRepository {
  async create(data: {
    examId: string
    userId: string
    email: string
  }): Promise<IExamParticipant> {
    try {
      logger.debug('Creating exam participant in repository', {
        examId: data.examId,
        email: data.email,
      })
      const participant = new ExamParticipant({
        ...data,
        examId: new Types.ObjectId(data.examId),
        userId: new Types.ObjectId(data.userId),
      })
      await participant.save()
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

  async findByExamId(examId: string): Promise<IExamParticipant[]> {
    try {
      logger.debug('Finding exam participants by exam ID in repository', {
        examId,
      })
      const participants = await ExamParticipant.find({
        examId: new Types.ObjectId(examId),
      }).sort({ addedAt: -1 })
      return participants
    } catch (error) {
      logger.error(
        'Error finding exam participants by exam ID in repository',
        error
      )
      throw error
    }
  }

  async findByUserId(userId: string): Promise<IExamParticipant[]> {
    try {
      logger.debug('Finding exam participants by user ID in repository', {
        userId,
      })
      const participants = await ExamParticipant.find({
        userId: new Types.ObjectId(userId),
      }).sort({ addedAt: -1 })
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

  async markAsUsed(id: string): Promise<boolean> {
    try {
      logger.debug('Marking exam participant as used in repository', {
        participantId: id,
      })
      const result = await ExamParticipant.findByIdAndUpdate(
        id,
        { isUsed: true },
        { new: true }
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

  async deleteById(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting exam participant in repository', {
        participantId: id,
      })
      const result = await ExamParticipant.findByIdAndDelete(id)
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
        status: { $ne: 'not-started' },
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
