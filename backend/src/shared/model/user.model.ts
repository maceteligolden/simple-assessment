import mongoose, { Schema, Document } from 'mongoose'
import { logger } from '../util/logger'
import { UserRole, USER_ROLE_VALUES } from '../constants'

export interface IUser extends Document {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  refreshToken?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name must not exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name must not exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      required: [true, 'Role is required'],
    },
    refreshToken: {
      type: String,
      select: false, // Don't include refresh token in queries by default
    },
  },
  {
    timestamps: true,
  }
)

// Unique index on email to prevent duplicate emails
// Application logic enforces that one email cannot be used for both roles
userSchema.index({ email: 1 }, { unique: true })

// Pre-save hook for logging
userSchema.pre('save', function (next) {
  if (this.isNew) {
    logger.info('Creating new user', {
      email: this.email,
      role: this.role,
    })
  } else {
    logger.info('Updating user', {
      email: this.email,
      role: this.role,
      modifiedFields: Object.keys(this.modifiedPaths()),
    })
  }
  next()
})

// Post-save hook for logging
userSchema.post('save', function (doc) {
  logger.info('User saved successfully', {
    userId: doc._id,
    email: doc.email,
    role: doc.role,
  })
})

export const User = mongoose.model<IUser>('User', userSchema)
