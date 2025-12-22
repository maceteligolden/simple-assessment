import mongoose, { Schema, Document } from 'mongoose'
import { logger } from '../util/logger'
import { Types } from 'mongoose'

export interface IExam extends Document {
  title: string
  description?: string
  duration: number // in minutes
  creatorId: Types.ObjectId
  availableAnytime: boolean
  startDate?: Date
  endDate?: Date
  randomizeQuestions: boolean
  showResultsImmediately: boolean
  isActive: boolean
  isDeleted: boolean
  questions: Types.ObjectId[] // References to questions
  createdAt: Date
  updatedAt: Date
}

const examSchema = new Schema<IExam>(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must not exceed 1000 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Exam duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [1440, 'Duration must not exceed 24 hours (1440 minutes)'],
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    availableAnytime: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      validate: {
        validator: function (this: IExam, value: Date) {
          if (this.availableAnytime) return true
          return value !== undefined
        },
        message: 'Start date is required when exam is not available anytime',
      },
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: IExam, value: Date) {
          if (this.availableAnytime) return true
          if (!this.startDate) return true
          return value > this.startDate
        },
        message: 'End date must be after start date',
      },
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    showResultsImmediately: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Indexes
examSchema.index({ creatorId: 1, isDeleted: 1 })
examSchema.index({ isActive: 1, isDeleted: 1 })
examSchema.index({ startDate: 1, endDate: 1 })

// Pre-save hook for logging
examSchema.pre('save', function (next) {
  if (this.isNew) {
    logger.info('Creating new exam', {
      title: this.title,
      creatorId: this.creatorId,
    })
  } else {
    logger.info('Updating exam', {
      examId: this._id,
      modifiedFields: Object.keys(this.modifiedPaths()),
    })
  }
  next()
})

// Post-save hook for logging
examSchema.post('save', function (doc) {
  logger.info('Exam saved successfully', {
    examId: doc._id,
    title: doc.title,
    isActive: doc.isActive,
  })
})

export const Exam = mongoose.model<IExam>('Exam', examSchema)
