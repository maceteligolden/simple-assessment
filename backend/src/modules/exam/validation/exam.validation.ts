import { z } from 'zod'

/**
 * Validation schemas for exam management
 */

// Create Exam Schema
export const createExamSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    description: z
      .union([
        z
          .string()
          .max(1000, 'Description must not exceed 1000 characters')
          .trim(),
        z.literal(''),
        z.undefined(),
      ])
      .transform(val => (val === '' ? undefined : val))
      .optional(),
    duration: z
      .number('Duration is required')
      .int('Duration must be an integer')
      .min(1, 'Duration must be at least 1 minute')
      .max(1440, 'Duration must not exceed 24 hours (1440 minutes)'),
    availableAnytime: z.boolean('Available anytime is required'),
    startDate: z
      .union([z.string(), z.literal(''), z.undefined()])
      .transform(val => (val === '' || val === null ? undefined : val))
      .optional(),
    endDate: z
      .union([z.string(), z.literal(''), z.undefined()])
      .transform(val => (val === '' || val === null ? undefined : val))
      .optional(),
    randomizeQuestions: z.boolean().optional().default(false),
    showResultsImmediately: z.boolean().optional().default(true),
    passPercentage: z
      .number('Pass percentage is required')
      .int('Pass percentage must be an integer')
      .min(1, 'Pass percentage must be at least 1%')
      .max(100, 'Pass percentage must not exceed 100%'),
  }),
})

// Update Exam Schema
export const updateExamSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .trim()
      .optional(),
    duration: z
      .number()
      .int('Duration must be an integer')
      .min(1, 'Duration must be at least 1 minute')
      .max(1440, 'Duration must not exceed 24 hours (1440 minutes)')
      .optional(),
    availableAnytime: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    randomizeQuestions: z.boolean().optional(),
    showResultsImmediately: z.boolean().optional(),
    passPercentage: z
      .number()
      .int('Pass percentage must be an integer')
      .min(1, 'Pass percentage must be at least 1%')
      .max(100, 'Pass percentage must not exceed 100%')
      .optional(),
  }),
})

// Type exports
export type CreateExamInput = z.infer<typeof createExamSchema>
export type UpdateExamInput = z.infer<typeof updateExamSchema>
