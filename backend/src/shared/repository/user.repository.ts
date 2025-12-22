import { injectable } from 'tsyringe'
import { IUser, User } from '../model/user.model'
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
} from '../../modules/auth/interfaces/auth.interface'
import { logger } from '../util/logger'

/**
 * User Repository Interface
 * Defines the contract for user data access
 */
export interface IUserRepository {
  create(data: CreateUserInput): Promise<IUser>
  findById(
    id: string,
    includePassword?: boolean,
    includeRefreshToken?: boolean
  ): Promise<IUser | null>
  findByEmail(
    email: string,
    includePassword?: boolean,
    includeRefreshToken?: boolean
  ): Promise<IUser | null>
  findOne(
    filters: UserFilters,
    includePassword?: boolean,
    includeRefreshToken?: boolean
  ): Promise<IUser | null>
  updateById(id: string, data: UpdateUserInput): Promise<IUser | null>
  updateRefreshToken(id: string, refreshToken: string): Promise<IUser | null>
  deleteById(id: string): Promise<boolean>
}

/**
 * User Repository Implementation
 * Handles all database operations for users
 */
@injectable()
export class UserRepository implements IUserRepository {
  /**
   * Create a new user
   */
  async create(data: CreateUserInput): Promise<IUser> {
    try {
      logger.debug('Creating user in repository', {
        email: data.email,
        role: data.role,
      })
      const user = new User(data)
      await user.save()
      logger.debug('User created successfully in repository', {
        userId: user._id.toString(),
      })
      return user
    } catch (error) {
      logger.error('Error creating user in repository', error)
      throw error
    }
  }

  /**
   * Find user by ID
   */
  async findById(
    id: string,
    includePassword = false,
    includeRefreshToken = false
  ): Promise<IUser | null> {
    try {
      logger.debug('Finding user by ID in repository', { userId: id })
      let query = User.findById(id)

      if (includePassword) {
        query = query.select('+password')
      }
      if (includeRefreshToken) {
        query = query.select('+refreshToken')
      }

      const user = await query.exec()
      return user
    } catch (error) {
      logger.error('Error finding user by ID in repository', error)
      throw error
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
    includePassword = false,
    includeRefreshToken = false
  ): Promise<IUser | null> {
    try {
      logger.debug('Finding user by email in repository', { email })
      let query = User.findOne({ email })

      if (includePassword) {
        query = query.select('+password')
      }
      if (includeRefreshToken) {
        query = query.select('+refreshToken')
      }

      const user = await query.exec()
      return user
    } catch (error) {
      logger.error('Error finding user by email in repository', error)
      throw error
    }
  }

  /**
   * Find one user by filters
   */
  async findOne(
    filters: UserFilters,
    includePassword = false,
    includeRefreshToken = false
  ): Promise<IUser | null> {
    try {
      logger.debug('Finding user by filters in repository', { filters })
      let query = User.findOne(filters)

      if (includePassword) {
        query = query.select('+password')
      }
      if (includeRefreshToken) {
        query = query.select('+refreshToken')
      }

      const user = await query.exec()
      return user
    } catch (error) {
      logger.error('Error finding user in repository', error)
      throw error
    }
  }

  /**
   * Update user by ID
   */
  async updateById(id: string, data: UpdateUserInput): Promise<IUser | null> {
    try {
      logger.debug('Updating user in repository', { userId: id })
      const user = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
      return user
    } catch (error) {
      logger.error('Error updating user in repository', error)
      throw error
    }
  }

  /**
   * Update refresh token for user
   */
  async updateRefreshToken(
    id: string,
    refreshToken: string
  ): Promise<IUser | null> {
    try {
      logger.debug('Updating refresh token in repository', { userId: id })
      const user = await User.findByIdAndUpdate(
        id,
        { refreshToken },
        { new: true }
      )
      return user
    } catch (error) {
      logger.error('Error updating refresh token in repository', error)
      throw error
    }
  }

  /**
   * Delete user by ID
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting user in repository', { userId: id })
      const result = await User.findByIdAndDelete(id)
      return !!result
    } catch (error) {
      logger.error('Error deleting user in repository', error)
      throw error
    }
  }
}
