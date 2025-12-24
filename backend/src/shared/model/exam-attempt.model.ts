import mongoose, { Schema, Document } from 'mongoose'
import { Types } from 'mongoose'
import { EXAM_ATTEMPT_STATUS } from '../constants'

export type AttemptStatus =
  | 'not-started'
  | 'in-progress'
  | 'abandoned'
  | 'submitted'
  | 'expired'

export interface IExamAttempt extends Document {
  examId: Types.ObjectId
  participantId: Types.ObjectId
  userId: Types.ObjectId
  status: AttemptStatus
  startedAt?: Date
  submittedAt?: Date
  abandonedAt?: Date
  lastActivityAt?: Date
  timeRemaining: number // in seconds
  currentQuestionIndex: number
  answeredQuestions: number[] // Array of question indices
  questionOrder: number[] // Randomized order if exam.randomizeQuestions is true
  answers: Map<
    string,
    {
      answer: string | string[]
      answeredAt: Date
      updatedAt: Date
    }
  >
  score?: number
  maxScore?: number
  percentage?: number
  createdAt: Date
  updatedAt: Date
}

const answerSchema = new Schema(
  {
    answer: Schema.Types.Mixed,
    answeredAt: Date,
    updatedAt: Date,
  },
  { _id: false }
)

const examAttemptSchema = new Schema<IExamAttempt>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'ExamParticipant',
      required: [true, 'Participant ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: [
        EXAM_ATTEMPT_STATUS.NOT_STARTED,
        EXAM_ATTEMPT_STATUS.IN_PROGRESS,
        EXAM_ATTEMPT_STATUS.ABANDONED,
        EXAM_ATTEMPT_STATUS.SUBMITTED,
        EXAM_ATTEMPT_STATUS.EXPIRED,
      ],
      default: EXAM_ATTEMPT_STATUS.NOT_STARTED,
      index: true,
    },
    startedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    abandonedAt: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
      index: true,
    },
    timeRemaining: {
      type: Number,
      default: 0,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    answeredQuestions: {
      type: [Number],
      default: [],
    },
    questionOrder: {
      type: [Number],
      default: [],
    },
    answers: {
      type: Map,
      of: answerSchema,
      default: new Map(),
    },
    score: {
      type: Number,
    },
    maxScore: {
      type: Number,
    },
    percentage: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes
examAttemptSchema.index({ examId: 1, userId: 1 }, { unique: true })
examAttemptSchema.index({ participantId: 1, status: 1 })
examAttemptSchema.index({ userId: 1, status: 1 })

export const ExamAttempt = mongoose.model<IExamAttempt>(
  'ExamAttempt',
  examAttemptSchema
)
