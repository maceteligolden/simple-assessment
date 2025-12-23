/**
 * Exam Attempt Status Constants
 * Defines all possible statuses for exam attempts
 */

export const EXAM_ATTEMPT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
  ABANDONED: 'abandoned',
} as const

/**
 * Type definitions for attempt statuses
 */
export type ExamAttemptStatus =
  | typeof EXAM_ATTEMPT_STATUS.NOT_STARTED
  | typeof EXAM_ATTEMPT_STATUS.IN_PROGRESS
  | typeof EXAM_ATTEMPT_STATUS.COMPLETED
  | typeof EXAM_ATTEMPT_STATUS.SUBMITTED
  | typeof EXAM_ATTEMPT_STATUS.ABANDONED
