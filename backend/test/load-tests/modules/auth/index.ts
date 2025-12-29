/**
 * Authentication Load Tests
 * 
 * Tests all authentication endpoints under various load conditions
 * 
 * Available tests:
 * - signup.load.test.ts - User registration stress test
 * - signin.load.test.ts - User authentication stress test
 * - refresh-token.load.test.ts - Token refresh stress test
 * - profile.load.test.ts - User profile retrieval stress test
 * - signout.load.test.ts - User signout stress test
 * - search-users.load.test.ts - User search stress test (examiner only)
 */

export * from './signup.load.test'
export * from './signin.load.test'
export * from './refresh-token.load.test'
export * from './profile.load.test'
export * from './signout.load.test'
export * from './search-users.load.test'


