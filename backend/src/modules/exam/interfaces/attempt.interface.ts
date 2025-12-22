import { Request, Response, NextFunction } from 'express'
import { PaginationInput } from '../../../shared/interfaces/pagination.interface'

/**
 * Exam Attempt Interfaces
 * Following the Input/Output naming convention for business logic
 * Controllers extract fields from request and pass clean data to services
 */

// Start Exam (by access code)
export interface StartExamInput {
  accessCode: string
}

export interface StartExamOutput {
  attemptId: string
  examId: string
  title: string
  description?: string
  duration: number
  totalQuestions: number
  startedAt: string
  timeRemaining: number
}

// Get Next Question
export interface GetNextQuestionInput {
  attemptId: string
}

export interface GetNextQuestionOutput {
  question: {
    id: string
    type: string
    question: string | Record<string, unknown>
    options?: string[]
    points: number
    order: number
  }
  progress: {
    answered: number
    total: number
    currentIndex: number
    percentage: number
    remaining: number
  }
  timeRemaining: number
}

// Submit Answer
export interface SubmitAnswerInput {
  attemptId: string
  questionId: string
  answer: string | string[]
}

export interface SubmitAnswerOutput {
  message: string
  timeRemaining: number
  progress: {
    answered: number
    total: number
  }
}

// Submit Exam
export interface SubmitExamInput {
  attemptId: string
}

export interface SubmitExamOutput {
  attemptId: string
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
}

// Get Attempt Results
export interface GetAttemptResultsInput {
  attemptId: string
}

export interface GetAttemptResultsOutput {
  attemptId: string
  examId: string
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
  answers: Array<{
    questionId: string
    question: string
    userAnswer: string | string[]
    correctAnswer: string | string[]
    isCorrect: boolean
    points: number
    earnedPoints: number
  }>
}

// Get My Results (for participant)
export interface GetMyResultsInput extends PaginationInput {}

export interface GetMyResultsOutput {
  data: Array<{
    attemptId: string
    examId: string
    examTitle: string
    score: number
    maxScore: number
    percentage: number
    submittedAt: string
    status: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Exam Attempt Controller Interface
 */
export interface IExamAttemptController {
  startExam(req: Request, res: Response, next: NextFunction): Promise<void>
  getNextQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>
  submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void>
  submitExam(req: Request, res: Response, next: NextFunction): Promise<void>
  getAttemptResults(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>
  getMyResults(req: Request, res: Response, next: NextFunction): Promise<void>
}

/**
 * Exam Attempt Service Interface
 */
export interface IExamAttemptService {
  startExam(data: StartExamInput, userId: string): Promise<StartExamOutput>
  getNextQuestion(
    data: GetNextQuestionInput,
    userId: string
  ): Promise<GetNextQuestionOutput>
  submitAnswer(
    data: SubmitAnswerInput,
    userId: string
  ): Promise<SubmitAnswerOutput>
  submitExam(data: SubmitExamInput, userId: string): Promise<SubmitExamOutput>
  getAttemptResults(
    data: GetAttemptResultsInput,
    userId: string
  ): Promise<GetAttemptResultsOutput>
  getMyResults(
    data: GetMyResultsInput,
    userId: string
  ): Promise<GetMyResultsOutput>
}
