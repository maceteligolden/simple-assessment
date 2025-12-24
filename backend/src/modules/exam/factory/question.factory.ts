import { IQuestion, QuestionType } from '../../../shared/model'
import { MultiChoiceQuestion } from './questions/multi-choice.question'
import { MultipleSelectQuestion } from './questions/multiple-select.question'

/**
 * Question Creation Input
 * Raw input data for creating a question
 */
export interface CreateQuestionInput {
  type: QuestionType
  question: string | Record<string, unknown>
  options?: string[]
  correctAnswer: string | string[] | Record<string, unknown>
  points?: number
  order?: number
}

/**
 * Question Creation Output
 * Structured question data ready for database
 */
export interface CreateQuestionOutput {
  type: QuestionType
  question: string | Record<string, unknown>
  options?: string[]
  correctAnswer: string | string[] | Record<string, unknown>
  points: number
  order: number
}

/**
 * Question Interface
 * All question types must implement this interface
 */
export interface IQuestionHandler {
  /**
   * Create a properly structured question from raw input
   * Validates and normalizes the question data
   * @param input - Raw question input data
   * @returns Structured question data ready for database
   */
  createQuestion(input: CreateQuestionInput): CreateQuestionOutput

  /**
   * Validate if the question structure is valid for this question type
   * @param question - The question data to validate
   * @param options - Optional question options
   * @param correctAnswer - The correct answer
   * @returns true if valid, throws error if invalid
   */
  validateQuestionStructure(
    question: string | Record<string, unknown>,
    options?: string[],
    correctAnswer?: string | string[] | Record<string, unknown>
  ): void

  /**
   * Validate if the provided answer is in the correct format
   */
  validateAnswerFormat(answer: unknown): boolean

  /**
   * Mark the answer and return the score
   * @param answer - The user's answer
   * @param correctAnswer - The correct answer
   * @param points - Points for this question
   * @param options - Optional question options (needed for index-based answers)
   * @returns Score (0 to points)
   */
  markAnswer(
    answer: unknown,
    correctAnswer: unknown,
    points: number,
    options?: string[]
  ): number

  /**
   * Render question data for client display
   * @param question - The question data
   * @returns Formatted question data for frontend
   */
  render(question: IQuestion): {
    id: string
    type: QuestionType
    question: string | Record<string, unknown>
    options?: string[]
    points: number
    order: number
  }
}

/**
 * Question Factory
 * Creates appropriate question handler based on question type
 */
export class QuestionFactory {
  private static handlers: Map<QuestionType, new () => IQuestionHandler> =
    new Map()

  /**
   * Register a question type handler
   */
  static register(
    type: QuestionType,
    handlerClass: new () => IQuestionHandler
  ): void {
    this.handlers.set(type, handlerClass)
  }

  /**
   * Create a question handler instance
   */
  static create(type: QuestionType): IQuestionHandler {
    const HandlerClass = this.handlers.get(type)

    if (!HandlerClass) {
      throw new Error(`Question type "${type}" is not supported`)
    }

    return new HandlerClass()
  }

  /**
   * Check if a question type is supported
   */
  static isSupported(type: QuestionType): boolean {
    return this.handlers.has(type)
  }

  /**
   * Create a question using the appropriate handler
   * Validates and structures the question data based on type
   * @param input - Raw question input data
   * @returns Structured question data ready for database
   */
  static createQuestion(input: CreateQuestionInput): CreateQuestionOutput {
    // Validate question type is supported
    if (!this.isSupported(input.type)) {
      throw new Error(`Question type "${input.type}" is not supported`)
    }

    // Get the handler for this question type
    const handler = this.create(input.type)

    // Use handler to create and validate the question
    return handler.createQuestion(input)
  }
}

// Register default question types
QuestionFactory.register('multi-choice', MultiChoiceQuestion)
QuestionFactory.register('multiple-select', MultipleSelectQuestion)
