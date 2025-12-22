import { Request, Response, NextFunction } from 'express'

/**
 * Question Interfaces
 * Following the Input/Output naming convention for business logic
 * Controllers extract fields from request and pass clean data to services
 */

// Add Question
export interface AddQuestionInput {
  examId: string
  type: string
  question: string | Record<string, unknown>
  options?: string[]
  correctAnswer: string | string[] | Record<string, unknown>
  points?: number
}

export interface AddQuestionOutput {
  id: string
  type: string
  question: string | Record<string, unknown>
  options?: string[]
  points: number
  order: number
}

// Update Question
export interface UpdateQuestionInput {
  examId: string
  questionId: string
  question?: string | Record<string, unknown>
  options?: string[]
  correctAnswer?: string | string[] | Record<string, unknown>
  points?: number
}

export interface UpdateQuestionOutput {
  id: string
  question: string | Record<string, unknown>
  options?: string[]
  points: number
}

// Delete Question
export interface DeleteQuestionInput {
  examId: string
  questionId: string
}

export interface DeleteQuestionOutput {
  message: string
}

/**
 * Question Controller Interface
 */
export interface IQuestionController {
  addQuestion(req: Request, res: Response, next: NextFunction): Promise<void>
  updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void>
  deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void>
}

/**
 * Question Service Interface
 */
export interface IQuestionService {
  addQuestion(
    data: AddQuestionInput,
    userId: string
  ): Promise<AddQuestionOutput>
  updateQuestion(
    data: UpdateQuestionInput,
    userId: string
  ): Promise<UpdateQuestionOutput>
  deleteQuestion(
    data: DeleteQuestionInput,
    userId: string
  ): Promise<DeleteQuestionOutput>
}
