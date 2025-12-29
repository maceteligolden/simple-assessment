import { ClientSession } from 'mongoose'

/**
 * Repository options for operations that support transactions and optimistic locking
 */
export interface RepositoryOptions {
  /**
   * MongoDB client session for transaction support
   */
  session?: ClientSession
  
  /**
   * For optimistic locking - expected version of the document
   */
  expectedVersion?: number
}

