import mongoose, { Schema, Document } from 'mongoose'
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

export const User = mongoose.model<IUser>('User', userSchema)
