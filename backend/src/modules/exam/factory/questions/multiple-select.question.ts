import {
  IQuestionHandler,
  CreateQuestionInput,
  CreateQuestionOutput,
} from '../question.factory'
import { IQuestion, QuestionType } from '../../../../shared/model'
import { logger } from '../../../../shared/util'

/**
 * Multiple-Select Question Handler
 * Handles validation, marking, and rendering for multiple-select questions
 * Participants can select multiple correct answers (checkboxes)
 * Scoring: All-or-nothing (must select all correct answers and no incorrect ones)
 */
export class MultipleSelectQuestion implements IQuestionHandler {
  /**
   * Create a properly structured multiple-select question from raw input
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

    // Normalize correct answer (must be array of option indices as strings)
    let normalizedCorrectAnswer: string[]
    if (Array.isArray(input.correctAnswer)) {
      // Filter and validate each index
      normalizedCorrectAnswer = input.correctAnswer
        .map(ans => String(ans).trim())
        .filter(ans => {
          // Validate it's a valid numeric index
          const index = parseInt(ans, 10)
          return (
            !isNaN(index) &&
            index >= 0 &&
            index < normalizedOptions.length &&
            index.toString() === ans &&
            /^\d+$/.test(ans)
          )
        })
    } else if (typeof input.correctAnswer === 'string') {
      // Single index provided as string, convert to array
      const index = parseInt(input.correctAnswer.trim(), 10)
      if (
        isNaN(index) ||
        index < 0 ||
        index >= normalizedOptions.length ||
        index.toString() !== input.correctAnswer.trim() ||
        !/^\d+$/.test(input.correctAnswer.trim())
      ) {
        throw new Error(
          `Invalid correct answer index: ${input.correctAnswer}. Must be a valid option index (0 to ${normalizedOptions.length - 1})`
        )
      }
      normalizedCorrectAnswer = [input.correctAnswer.trim()]
    } else {
      throw new Error(
        'Correct answer for multiple-select must be an array of option indices or a single index string'
      )
    }

    // Remove duplicates and sort for consistency
    normalizedCorrectAnswer = Array.from(new Set(normalizedCorrectAnswer)).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10)
    )

    // Validate minimum 2 correct answers required
    if (normalizedCorrectAnswer.length < 2) {
      throw new Error(
        'Multiple-select questions must have at least 2 correct answers'
      )
    }

    // Set defaults
    const points = input.points ?? 1
    const order = input.order ?? 0

    return {
      type: 'multiple-select',
      question: normalizedQuestion,
      options: normalizedOptions,
      correctAnswer: normalizedCorrectAnswer,
      points,
      order,
    }
  }

  /**
   * Validate question structure for multiple-select
   * - Question text must be provided
   * - Options array must have at least 2 options
   * - Correct answer must be an array with at least 2 valid option indices
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
      throw new Error('Options array is required for multiple-select questions')
    }

    if (options.length < 2) {
      throw new Error('Multiple-select questions must have at least 2 options')
    }

    // Check for empty options
    const hasEmptyOptions = options.some(opt => !opt || opt.trim().length === 0)
    if (hasEmptyOptions) {
      throw new Error('All options must have non-empty values')
    }

    // Validate correct answer
    if (!correctAnswer) {
      throw new Error(
        'Correct answer is required for multiple-select questions'
      )
    }

    // Must be an array
    if (!Array.isArray(correctAnswer)) {
      throw new Error(
        'Correct answer for multiple-select must be an array of option indices'
      )
    }

    if (correctAnswer.length < 2) {
      throw new Error(
        'Multiple-select questions must have at least 2 correct answers'
      )
    }

    // Validate each index in the array
    const validIndices: number[] = []
    for (const ans of correctAnswer) {
      if (typeof ans !== 'string') {
        throw new Error(
          'Each correct answer must be a string representing an option index'
        )
      }

      const trimmedAns = ans.trim()
      const index = parseInt(trimmedAns, 10)

      // Check if it's a valid numeric index
      if (
        isNaN(index) ||
        index < 0 ||
        index >= options.length ||
        index.toString() !== trimmedAns ||
        !/^\d+$/.test(trimmedAns)
      ) {
        throw new Error(
          `Invalid correct answer index: ${ans}. Must be a valid option index (0 to ${options.length - 1})`
        )
      }

      validIndices.push(index)
    }

    // Check for duplicate indices
    const uniqueIndices = new Set(validIndices)
    if (uniqueIndices.size !== validIndices.length) {
      throw new Error('Correct answer array contains duplicate indices')
    }
  }

  /**
   * Validate answer format for multiple-select
   * Answer should be an array of selected option indices
   */
  validateAnswerFormat(answer: unknown): boolean {
    if (!Array.isArray(answer)) {
      logger.warn('Invalid answer format for multiple-select question', {
        answer,
        expectedType: 'array',
      })
      return false
    }

    // Validate all items are strings (representing indices)
    const allValid = answer.every(
      item => typeof item === 'string' && item.trim().length > 0
    )

    if (!allValid) {
      logger.warn(
        'Invalid answer format for multiple-select question: all items must be non-empty strings',
        {
          answer,
        }
      )
      return false
    }

    return true
  }

  /**
   * Mark multiple-select answer
   * All-or-nothing scoring: must select all correct answers and no incorrect ones
   * @param answer - User's answer (array of option indices as strings)
   * @param correctAnswer - Correct answer (array of option indices as strings)
   * @param points - Points for this question
   * @param options - Optional question options (for validation)
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

    // Ensure correctAnswer is an array
    if (!Array.isArray(correctAnswer)) {
      logger.error(
        'Invalid correct answer format for multiple-select question',
        {
          correctAnswer,
        }
      )
      return 0
    }

    // Normalize both arrays: sort and remove duplicates
    const userAnswerArray = (answer as string[])
      .map(ans => String(ans).trim())
      .filter(ans => {
        // Validate indices if options are provided
        if (options) {
          const index = parseInt(ans, 10)
          return (
            !isNaN(index) &&
            index >= 0 &&
            index < options.length &&
            index.toString() === ans &&
            /^\d+$/.test(ans)
          )
        }
        return /^\d+$/.test(ans) // At least validate it's numeric
      })
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

    const correctAnswerArray = (correctAnswer as string[])
      .map(ans => String(ans).trim())
      .filter(ans => /^\d+$/.test(ans))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

    // Remove duplicates
    const uniqueUserAnswers = Array.from(new Set(userAnswerArray))
    const uniqueCorrectAnswers = Array.from(new Set(correctAnswerArray))

    // All-or-nothing: must match exactly (same length and same values)
    const isCorrect =
      uniqueUserAnswers.length === uniqueCorrectAnswers.length &&
      uniqueUserAnswers.every(
        (ans, index) => ans === uniqueCorrectAnswers[index]
      )

    logger.debug('Multiple-select answer marked', {
      userAnswer: answer,
      normalizedUserAnswer: uniqueUserAnswers,
      correctAnswer: correctAnswer,
      normalizedCorrectAnswer: uniqueCorrectAnswers,
      isCorrect,
      points: isCorrect ? points : 0,
    })

    return isCorrect ? points : 0
  }

  /**
   * Render multiple-select question for client
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
