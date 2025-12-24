import mongoose, { Schema, Document } from 'mongoose'
import { Types } from 'mongoose'
import crypto from 'crypto'

export interface IExamParticipant extends Document {
  examId: Types.ObjectId
  userId: Types.ObjectId
  email: string
  accessCode: string
  isUsed: boolean
  addedAt: Date
  createdAt: Date
  updatedAt: Date
}

const examParticipantSchema = new Schema<IExamParticipant>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    accessCode: {
      type: String,
      required: [true, 'Access code is required'],
      unique: true,
      index: true,
      default: () => generateAccessCode(),
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for exam and user
examParticipantSchema.index({ examId: 1, userId: 1 }, { unique: true })

// Generate unique access code
function generateAccessCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase()
}

export const ExamParticipant = mongoose.model<IExamParticipant>(
  'ExamParticipant',
  examParticipantSchema
)
