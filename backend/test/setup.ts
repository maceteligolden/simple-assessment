/**
 * Global test setup file
 * This file runs before all tests
 */

import 'reflect-metadata'
import { beforeAll, afterAll } from 'vitest'

// Setup before all tests
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db'
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key'
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
  process.env.JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '7d'
})

// Cleanup after all tests
afterAll(() => {
  // Cleanup if needed
})
