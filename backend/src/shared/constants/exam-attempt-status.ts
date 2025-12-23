/**
 * Exam Attempt Status Constants
 * Defines all possible statuses for exam attempts
 */

export const EXAM_ATTEMPT_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  ABANDONED: 'abandoned',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
} as const

/**
 * Participant-facing attempt status (mapped from backend status)
 * Used when displaying status to examiners/participants
 */
export const PARTICIPANT_ATTEMPT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const

/**
 * Type definitions for attempt statuses
 */
export type ExamAttemptStatus =
  | typeof EXAM_ATTEMPT_STATUS.NOT_STARTED
  | typeof EXAM_ATTEMPT_STATUS.IN_PROGRESS
  | typeof EXAM_ATTEMPT_STATUS.ABANDONED
  | typeof EXAM_ATTEMPT_STATUS.SUBMITTED
  | typeof EXAM_ATTEMPT_STATUS.EXPIRED

export type ParticipantAttemptStatus =
  | typeof PARTICIPANT_ATTEMPT_STATUS.NOT_STARTED
  | typeof PARTICIPANT_ATTEMPT_STATUS.IN_PROGRESS
  | typeof PARTICIPANT_ATTEMPT_STATUS.COMPLETED
  | typeof PARTICIPANT_ATTEMPT_STATUS.ABANDONED

/**
 * Maps backend attempt status to participant-facing status
 */
export function mapAttemptStatusToParticipantStatus(
  status: ExamAttemptStatus
): ParticipantAttemptStatus {
  switch (status) {
    case EXAM_ATTEMPT_STATUS.SUBMITTED:
      return PARTICIPANT_ATTEMPT_STATUS.COMPLETED
    case EXAM_ATTEMPT_STATUS.IN_PROGRESS:
      return PARTICIPANT_ATTEMPT_STATUS.IN_PROGRESS
    case EXAM_ATTEMPT_STATUS.ABANDONED:
      return PARTICIPANT_ATTEMPT_STATUS.ABANDONED
    case EXAM_ATTEMPT_STATUS.NOT_STARTED:
    case EXAM_ATTEMPT_STATUS.EXPIRED:
    default:
      return PARTICIPANT_ATTEMPT_STATUS.NOT_STARTED
  }
}

