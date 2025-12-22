/**
 * Validation schemas for exam module
 * Centralized exports for all validation schemas
 */

// Exam validation
export {
  createExamSchema,
  updateExamSchema,
  type CreateExamInput,
  type UpdateExamInput,
} from './exam.validation'

// Question validation
export {
  addQuestionSchema,
  updateQuestionSchema,
  type AddQuestionInput,
  type UpdateQuestionInput,
} from './question.validation'

// Participant validation
export {
  addParticipantSchema,
  type AddParticipantInput,
} from './participant.validation'

// Attempt validation
export {
  startExamSchema,
  submitAnswerSchema,
  type StartExamInput,
  type SubmitAnswerInput,
} from './attempt.validation'
