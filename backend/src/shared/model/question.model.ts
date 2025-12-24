import mongoose, { Schema, Document } from 'mongoose'
import { Types } from 'mongoose'

export type QuestionType = 'multi-choice' | 'multiple-select' // Extensible for future types

export interface IQuestion extends Document {
  examId: Types.ObjectId
  type: QuestionType
  question: string | Record<string, unknown> // Flexible for text, audio, etc.
  options?: string[] // For multi-choice
  correctAnswer: string | string[] | Record<string, unknown> // Type-specific
  points: number
  order: number
  version: number // Optimistic locking version field
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
      enum: ['multi-choice', 'multiple-select'],
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
          if (this.type === 'multi-choice' || this.type === 'multiple-select') {
            return value && value.length >= 2
          }
          return true
        },
        message: 'Multi-choice and multiple-select questions must have at least 2 options',
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
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Enable optimistic locking
  }
)

// Compound index for exam and order
questionSchema.index({ examId: 1, order: 1 }, { unique: true })

export const Question = mongoose.model<IQuestion>('Question', questionSchema)
