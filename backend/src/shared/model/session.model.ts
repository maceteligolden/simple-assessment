import mongoose, { Schema, Document } from 'mongoose'
import { logger } from '../util/logger'
import { Types } from 'mongoose'

export interface ISession extends Document {
  userId: Types.ObjectId
  sessionToken: string
  refreshToken: string
  ipAddress?: string
  userAgent?: string
  expiresAt: Date
  lastActivity: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sessionToken: {
      type: String,
      required: [true, 'Session token is required'],
      unique: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: [true, 'Refresh token is required'],
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
sessionSchema.index({ userId: 1, isActive: 1 })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index for automatic cleanup

// Pre-save hook for logging
sessionSchema.pre('save', function (next) {
  if (this.isNew) {
    logger.debug('Creating new session', {
      userId: this.userId,
      sessionToken: this.sessionToken.substring(0, 10) + '...',
    })
  }
  next()
})

// Post-save hook for logging
sessionSchema.post('save', function (doc) {
  logger.debug('Session saved', {
    sessionId: doc._id,
    userId: doc.userId,
    isActive: doc.isActive,
  })
})

export const Session = mongoose.model<ISession>('Session', sessionSchema)
