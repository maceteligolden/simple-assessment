import { describe, it, expect } from 'vitest'
import {
  createExamSchema,
  updateExamSchema,
} from '../../../../src/modules/exam/validation/exam.validation'

describe('Exam Validation Schemas', () => {
  describe('createExamSchema', () => {
    it('should validate a valid exam creation input', () => {
      // Arrange
      const validInput = {
        body: {
          title: 'Test Exam',
          description: 'This is a test exam',
          duration: 60,
          availableAnytime: true,
          randomizeQuestions: false,
          showResultsImmediately: true,
          passPercentage: 50,
        },
      }

      // Act
      const result = createExamSchema.safeParse(validInput)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body.title).toBe(validInput.body.title)
      }
    })

    it('should reject exam with title less than 3 characters', () => {
      // Arrange
      const invalidInput = {
        body: {
          title: 'Te',
          description: 'Test',
          duration: 60,
          availableAnytime: true,
          passPercentage: 50,
        },
      }

      // Act
      const result = createExamSchema.safeParse(invalidInput)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject exam with duration less than 1 minute', () => {
      // Arrange
      const invalidInput = {
        body: {
          title: 'Test Exam',
          description: 'Test',
          duration: 0,
          availableAnytime: true,
          passPercentage: 50,
        },
      }

      // Act
      const result = createExamSchema.safeParse(invalidInput)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject exam with duration more than 1440 minutes', () => {
      // Arrange
      const invalidInput = {
        body: {
          title: 'Test Exam',
          description: 'Test',
          duration: 2000,
          availableAnytime: true,
          passPercentage: 50,
        },
      }

      // Act
      const result = createExamSchema.safeParse(invalidInput)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('updateExamSchema', () => {
    it('should validate a valid exam update input with partial fields', () => {
      // Arrange
      const validInput = {
        body: {
          title: 'Updated Exam Title',
        },
      }

      // Act
      const result = updateExamSchema.safeParse(validInput)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should allow empty body for update', () => {
      // Arrange
      const validInput = {
        body: {},
      }

      // Act
      const result = updateExamSchema.safeParse(validInput)

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
