import { z } from 'zod'

/**
 * Validation schemas for exam attempts
 */

// Start Exam Schema
export const startExamSchema = z.object({
  body: z.object({
    accessCode: z.string().min(1, 'Access code is required').trim(),
  }),
})

// Submit Answer Schema
export const submitAnswerSchema = z.object({
  body: z.object({
    answer: z.union([z.string(), z.array(z.string())]),
  }),
})

// Type exports
export type StartExamInput = z.infer<typeof startExamSchema>
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>
