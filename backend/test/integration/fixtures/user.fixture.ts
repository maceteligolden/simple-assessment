import { UserRole } from '../../../src/shared/constants/user-roles'

/**
 * Shared user fixtures for integration tests
 */
export const TEST_USER = {
  firstName: 'Test',
  lastName: 'Participant',
  email: 'participant@test.com',
  password: 'Password123!',
  role: 'participant' as UserRole,
}

export const TEST_EXAMINER = {
  firstName: 'Test',
  lastName: 'Examiner',
  email: 'examiner@test.com',
  password: 'Password123!',
  role: 'examiner' as UserRole,
}

export const INVALID_USER = {
  email: 'invalid@test.com',
  password: 'wrongpassword',
}

