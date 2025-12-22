import mongoose, { Schema, Document } from 'mongoose'
import { logger } from '../util/logger'
import { Types } from 'mongoose'

export type QuestionType = 'multi-choice' // Extensible for future types

export interface IQuestion extends Document {
  examId: Types.ObjectId
  type: QuestionType
  question: string | Record<string, unknown> // Flexible for text, audio, etc.
  options?: string[] // For multi-choice
  correctAnswer: string | string[] | Record<string, unknown> // Type-specific
  points: number
  order: number
  createdAt: Date
  updatedAt: Date
}

const questionSchema = new Schema<IQuestion>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['multi-choice'],
      required: [true, 'Question type is required'],
    },
    question: {
      type: Schema.Types.Mixed, // Allows string or object
      required: [true, 'Question content is required'],
    },
    options: {
      type: [String],
      validate: {
        validator: function (this: IQuestion, value: string[]) {
          if (this.type === 'multi-choice') {
            return value && value.length >= 2
          }
          return true
        },
        message: 'Multi-choice questions must have at least 2 options',
      },
    },
    correctAnswer: {
      type: Schema.Types.Mixed, // Allows string, array, or object
      required: [true, 'Correct answer is required'],
    },
    points: {
      type: Number,
      default: 1,
      min: [0, 'Points cannot be negative'],
    },
    order: {
      type: Number,
      required: [true, 'Question order is required'],
      min: [0, 'Order cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for exam and order
questionSchema.index({ examId: 1, order: 1 }, { unique: true })

// Pre-save hook for logging
questionSchema.pre('save', function (next) {
  if (this.isNew) {
    logger.debug('Creating new question', {
      examId: this.examId,
      type: this.type,
      order: this.order,
    })
  }
  next()
})

// Post-save hook for logging
questionSchema.post('save', function (doc) {
  logger.debug('Question saved successfully', {
    questionId: doc._id,
    examId: doc.examId,
    type: doc.type,
  })
})

export const Question = mongoose.model<IQuestion>('Question', questionSchema)
