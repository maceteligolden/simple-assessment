export { default as examRoutes } from './exam.routes'
export * from './controllers'
export * from './services'
export * from './factory'
export * from './interfaces'
// Export validation schemas only, not types (types are in interfaces)
export {
  createExamSchema,
  updateExamSchema,
  addQuestionSchema,
  updateQuestionSchema,
  addParticipantSchema,
  startExamSchema,
  submitAnswerSchema,
} from './validation'
