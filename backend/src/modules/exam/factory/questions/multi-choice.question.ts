import {
  IQuestionHandler,
  CreateQuestionInput,
  CreateQuestionOutput,
} from '../question.factory'
import { IQuestion, QuestionType } from '../../../../shared/model'
import { logger } from '../../../../shared/util'

/**
 * Multi-Choice Question Handler
 * Handles validation, marking, and rendering for multi-choice questions
 */
export class MultiChoiceQuestion implements IQuestionHandler {
  /**
   * Create a properly structured multi-choice question from raw input
   * Validates and normalizes the question data
   */
  createQuestion(input: CreateQuestionInput): CreateQuestionOutput {
    // Normalize options first (trim whitespace) - needed for validation
    const normalizedOptions = input.options
      ? input.options.map(opt => opt.trim()).filter(opt => opt.length > 0)
      : []

    // Validate the input structure (after normalizing options)
    this.validateQuestionStructure(
      input.question,
      normalizedOptions.length > 0 ? normalizedOptions : input.options,
      input.correctAnswer
    )

    // Normalize question text (ensure it's a string)
    let normalizedQuestion: string | Record<string, unknown>
    if (typeof input.question === 'string') {
      normalizedQuestion = input.question.trim()
    } else if (
      typeof input.question === 'object' &&
      input.question !== null &&
      'text' in input.question
    ) {
      normalizedQuestion = {
        ...input.question,
        text: String(input.question.text).trim(),
      }
    } else {
      normalizedQuestion = input.question
    }

    // Normalize correct answer (trim and ensure it matches one of the options)
    let normalizedCorrectAnswer: string
    if (typeof input.correctAnswer === 'string') {
      normalizedCorrectAnswer = input.correctAnswer.trim()
    } else {
      throw new Error('Correct answer for multi-choice must be a string')
    }

    // Check if correctAnswer is an index (numeric string like "0", "1", "2")
    // Must be a pure numeric string (not "0abc" or " 0 ")
    const answerIndex = parseInt(normalizedCorrectAnswer, 10)
    const isPureNumeric =
      normalizedCorrectAnswer.length > 0 &&
      !isNaN(answerIndex) &&
      answerIndex.toString() === normalizedCorrectAnswer &&
      /^\d+$/.test(normalizedCorrectAnswer) // Ensure it's only digits

    if (
      isPureNumeric &&
      answerIndex >= 0 &&
      answerIndex < normalizedOptions.length
    ) {
      // It's a valid index, use the option at that index
      normalizedCorrectAnswer = normalizedOptions[answerIndex]
    } else {
      // It's not an index, treat it as option text
      // Verify correct answer is one of the options (case-insensitive)
      const normalizedOptionsLower = normalizedOptions.map(opt =>
        opt.toLowerCase()
      )
      const normalizedAnswerLower = normalizedCorrectAnswer.toLowerCase()

      if (!normalizedOptionsLower.includes(normalizedAnswerLower)) {
        throw new Error('Correct answer must be one of the provided options')
      }

      // Use the exact option value (case-sensitive from options array)
      const matchingOption = normalizedOptions.find(
        opt => opt.toLowerCase() === normalizedAnswerLower
      )
      if (matchingOption) {
        normalizedCorrectAnswer = matchingOption
      }
    }

    // Set defaults
    const points = input.points ?? 1
    const order = input.order ?? 0

    return {
      type: 'multi-choice',
      question: normalizedQuestion,
      options: normalizedOptions,
      correctAnswer: normalizedCorrectAnswer,
      points,
      order,
    }
  }

  /**
   * Validate question structure for multi-choice
   * - Question text must be provided
   * - Options array must have at least 2 options
   * - Correct answer must be provided and must be one of the options
   */
  validateQuestionStructure(
    question: string | Record<string, unknown>,
    options?: string[],
    correctAnswer?: string | string[] | Record<string, unknown>
  ): void {
    // Validate question text
    if (!question) {
      throw new Error('Question text is required')
    }

    if (typeof question === 'string') {
      if (question.trim().length === 0) {
        throw new Error('Question text cannot be empty')
      }
    } else if (typeof question === 'object') {
      if (
        !question.text ||
        typeof question.text !== 'string' ||
        question.text.trim().length === 0
      ) {
        throw new Error(
          'Question text is required and must be a non-empty string'
        )
      }
    }

    // Validate options
    if (!options || !Array.isArray(options)) {
      throw new Error('Options array is required for multi-choice questions')
    }

    if (options.length < 2) {
      throw new Error('Multi-choice questions must have at least 2 options')
    }

    // Check for empty options
    const hasEmptyOptions = options.some(opt => !opt || opt.trim().length === 0)
    if (hasEmptyOptions) {
      throw new Error('All options must have non-empty values')
    }

    // Validate correct answer
    if (!correctAnswer) {
      throw new Error('Correct answer is required for multi-choice questions')
    }

    if (typeof correctAnswer !== 'string') {
      throw new Error('Correct answer for multi-choice must be a string')
    }

    const trimmedAnswer = correctAnswer.trim()

    // Check if correctAnswer is an index (numeric string like "0", "1", "2")
    const answerIndex = parseInt(trimmedAnswer, 10)
    if (!isNaN(answerIndex) && answerIndex.toString() === trimmedAnswer) {
      // It's a numeric string representing an index, validate it's a valid index
      if (answerIndex < 0 || answerIndex >= options.length) {
        throw new Error(
          `Correct answer index ${answerIndex} is out of range. Must be between 0 and ${options.length - 1}`
        )
      }
      // Index is valid, no need to check against option text
      return
    }

    // It's not an index, verify it's one of the options (case-insensitive)
    const normalizedOptions = options.map(opt => opt.trim().toLowerCase())
    const normalizedAnswer = trimmedAnswer.toLowerCase()

    if (!normalizedOptions.includes(normalizedAnswer)) {
      throw new Error('Correct answer must be one of the provided options')
    }
  }

  /**
   * Validate answer format for multi-choice
   * Answer should be a string (single selection)
   */
  validateAnswerFormat(answer: unknown): boolean {
    if (typeof answer !== 'string') {
      logger.warn('Invalid answer format for multi-choice question', {
        answer,
        expectedType: 'string',
      })
      return false
    }

    if (answer.trim().length === 0) {
      return false
    }

    return true
  }

  /**
   * Mark multi-choice answer
   * Handles both index-based answers (from frontend) and text-based answers
   * Compares with correct answer (which is stored as option text)
   */
  markAnswer(
    answer: unknown,
    correctAnswer: unknown,
    points: number,
    options?: string[]
  ): number {
    if (!this.validateAnswerFormat(answer)) {
      return 0
    }

    // Ensure correctAnswer is a string
    if (typeof correctAnswer !== 'string') {
      logger.error('Invalid correct answer format for multi-choice question', {
        correctAnswer,
      })
      return 0
    }

    const userAnswerStr = String(answer).trim()
    const correctAnswerStr = String(correctAnswer).trim()

    // Check if user answer is an index (numeric string like "0", "1", "2")
    const answerIndex = parseInt(userAnswerStr, 10)
    const isIndexAnswer =
      !isNaN(answerIndex) &&
      answerIndex.toString() === userAnswerStr &&
      /^\d+$/.test(userAnswerStr)

    let normalizedUserAnswer: string

    if (isIndexAnswer && options && options.length > 0) {
      // User answer is an index, convert to option text
      if (answerIndex >= 0 && answerIndex < options.length) {
        normalizedUserAnswer = options[answerIndex].trim().toLowerCase()
      } else {
        logger.warn('User answer index out of range', {
          answerIndex,
          optionsLength: options.length,
        })
        return 0
      }
    } else {
      // User answer is already text, use as-is
      normalizedUserAnswer = userAnswerStr.toLowerCase()
    }

    // Normalize correct answer (it's stored as option text)
    const normalizedCorrectAnswer = correctAnswerStr.trim().toLowerCase()

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer

    logger.debug('Multi-choice answer marked', {
      originalUserAnswer: userAnswerStr,
      normalizedUserAnswer,
      normalizedCorrectAnswer,
      isIndexAnswer,
      isCorrect,
      points: isCorrect ? points : 0,
    })

    return isCorrect ? points : 0
  }

  /**
   * Render multi-choice question for client
   * Excludes correct answer for security
   */
  render(question: IQuestion): {
    id: string
    type: QuestionType
    question: string | Record<string, unknown>
    options?: string[]
    points: number
    order: number
  } {
    return {
      id: question._id.toString(),
      type: question.type,
      question: question.question,
      options: question.options,
      points: question.points,
      order: question.order,
      // Note: correctAnswer is intentionally excluded
    }
  }
}
