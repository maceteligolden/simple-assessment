import { z } from 'zod'

/**
 * Validation schemas for question management
 */

// Add Question Schema
export const addQuestionSchema = z
  .object({
    body: z.object({
      type: z.literal('multi-choice', {
        message: 'Question type must be "multi-choice"',
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
      // For multi-choice questions, validate that correctAnswer is a valid option index
      if (data.body.type === 'multi-choice') {
        const options = data.body.options || []
        const correctAnswer = data.body.correctAnswer

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
      return true
    },
    {
      message:
        'Correct answer must be a valid option index (0 to number of options - 1)',
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
