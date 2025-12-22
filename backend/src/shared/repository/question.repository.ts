import { injectable } from 'tsyringe'
import { IQuestion, Question } from '../model/question.model'
import { logger } from '../util/logger'
import { Types } from 'mongoose'

/**
 * Question Repository Interface
 */
export interface IQuestionRepository {
  create(data: {
    examId: string
    type: string
    question: string | Record<string, unknown>
    options?: string[]
    correctAnswer: string | string[] | Record<string, unknown>
    points?: number
    order: number
  }): Promise<IQuestion>
  findById(id: string): Promise<IQuestion | null>
  findByExamId(examId: string): Promise<IQuestion[]>
  updateById(id: string, data: Partial<IQuestion>): Promise<IQuestion | null>
  deleteById(id: string): Promise<boolean>
  updateOrder(
    examId: string,
    questionOrders: Array<{ id: string; order: number }>
  ): Promise<void>
}

/**
 * Question Repository Implementation
 */
@injectable()
export class QuestionRepository implements IQuestionRepository {
  async create(data: {
    examId: string
    type: string
    question: string | Record<string, unknown>
    options?: string[]
    correctAnswer: string | string[] | Record<string, unknown>
    points?: number
    order: number
  }): Promise<IQuestion> {
    try {
      logger.debug('Creating question in repository', {
        examId: data.examId,
        type: data.type,
      })
      const question = new Question({
        ...data,
        examId: new Types.ObjectId(data.examId),
        points: data.points ?? 1,
      })
      await question.save()
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
    data: Partial<IQuestion>
  ): Promise<IQuestion | null> {
    try {
      logger.debug('Updating question in repository', { questionId: id })
      const question = await Question.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
      return question
    } catch (error) {
      logger.error('Error updating question in repository', error)
      throw error
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting question in repository', { questionId: id })
      const result = await Question.findByIdAndDelete(id)
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
