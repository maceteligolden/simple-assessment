import { z } from 'zod'

/**
 * Validation schemas for question management
 */

// Add Question Schema
export const addQuestionSchema = z
  .object({
    body: z.object({
      type: z.enum(['multi-choice', 'multiple-select'], {
        message: 'Question type must be "multi-choice" or "multiple-select"',
      }),
      question: z.union([z.string(), z.record(z.string(), z.any())], {
        message: 'Question text is required',
      }),
      options: z
        .array(z.string().min(1, 'Option cannot be empty'))
        .min(2, 'Must have at least 2 options')
        .refine(
          options => options.every(opt => opt.trim().length > 0),
          'All options must be non-empty'
        ),
      correctAnswer: z.union(
        [z.string(), z.array(z.string()), z.record(z.string(), z.any())],
        {
          message: 'Correct answer is required',
        }
      ),
      points: z.number().int().min(0).default(1).optional(),
    }),
  })
  .refine(
    data => {
      const options = data.body.options || []
      const correctAnswer = data.body.correctAnswer

      // For multi-choice questions, validate that correctAnswer is a valid option index
      if (data.body.type === 'multi-choice') {
        // If correctAnswer is a string, check if it's a valid index
        if (typeof correctAnswer === 'string') {
          const index = parseInt(correctAnswer, 10)
          // Check if it's a valid number and within the options range
          if (isNaN(index) || index < 0 || index >= options.length) {
            return false
          }
        }
        // If it's an array or object, it's not valid for multi-choice
        else if (
          Array.isArray(correctAnswer) ||
          typeof correctAnswer === 'object'
        ) {
          return false
        }
      }
      // For multiple-select questions, validate that correctAnswer is an array of valid indices
      else if (data.body.type === 'multiple-select') {
        // Must be an array
        if (!Array.isArray(correctAnswer)) {
          return false
        }

        // Must have at least 2 correct answers
        if (correctAnswer.length < 2) {
          return false
        }

        // Each item must be a valid index
        for (const ans of correctAnswer) {
          if (typeof ans !== 'string') {
            return false
          }
          const index = parseInt(ans, 10)
          if (
            isNaN(index) ||
            index < 0 ||
            index >= options.length ||
            index.toString() !== ans.trim() ||
            !/^\d+$/.test(ans.trim())
          ) {
            return false
          }
        }

        // Check for duplicates
        const uniqueIndices = new Set(
          correctAnswer.map(ans => parseInt(String(ans).trim(), 10))
        )
        if (uniqueIndices.size !== correctAnswer.length) {
          return false
        }
      }
      return true
    },
    {
      message: 'Invalid correct answer format for the selected question type',
      path: ['body', 'correctAnswer'],
    }
  )

// Update Question Schema
export const updateQuestionSchema = z.object({
  body: z.object({
    question: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    options: z.array(z.string().min(1)).min(2).optional(),
    correctAnswer: z
      .union([z.string(), z.array(z.string()), z.record(z.string(), z.any())])
      .optional(),
    points: z.number().int().min(0).optional(),
  }),
})

// Type exports
export type AddQuestionInput = z.infer<typeof addQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
