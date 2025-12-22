import { Request, Response, NextFunction } from 'express'
import { PaginationInput } from '../../../shared/interfaces/pagination.interface'

/**
 * Exam Interfaces
 * Following the Input/Output naming convention for business logic
 * Controllers extract fields from request and pass clean data to services
 */

// Create Exam
export interface CreateExamInput {
  title: string
  description?: string
  duration: number
  availableAnytime: boolean
  startDate?: string
  endDate?: string
  randomizeQuestions: boolean
  showResultsImmediately: boolean
}

export interface CreateExamOutput {
  id: string
  title: string
  description?: string
  duration: number
  availableAnytime: boolean
  randomizeQuestions: boolean
  createdAt: string
}

// List Exams
export interface ListExamsInput extends PaginationInput {
  search?: string
  isActive?: boolean
}

export interface ListExamsOutput {
  data: Array<{
    id: string
    title: string
    description?: string
    duration: number
    questionCount: number
    participantCount: number
    createdAt: string
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

// Get Exam
export interface GetExamInput {
  examId: string
}

export interface GetExamOutput {
  id: string
  creatorId: string
  title: string
  description?: string
  duration: number
  availableAnytime: boolean
  startDate?: string
  endDate?: string
  randomizeQuestions: boolean
  showResultsImmediately: boolean
  questions: Array<{
    id: string
    type: string
    question: string | Record<string, unknown>
    options?: string[]
    points: number
    order: number
  }>
  participants: Array<{
    id: string
    email: string
    accessCode: string
    isUsed: boolean
    addedAt: string
  }>
  createdAt: string
  updatedAt: string
}

// Update Exam
export interface UpdateExamInput {
  examId: string
  title?: string
  description?: string
  duration?: number
  availableAnytime?: boolean
  startDate?: string
  endDate?: string
  randomizeQuestions?: boolean
  showResultsImmediately?: boolean
}

export interface UpdateExamOutput {
  id: string
  title: string
  description?: string
  duration: number
  updatedAt: string
}

// Delete Exam
export interface DeleteExamInput {
  examId: string
}

export interface DeleteExamOutput {
  message: string
}

// Get Exam Results (for examiner)
export interface GetExamResultsInput {
  examId: string
}

export type GetExamResultsOutput = Array<{
  attemptId: string
  participantEmail: string
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
  status: string
}>

// Get Exam by Access Code (for participants)
export interface GetExamByCodeInput {
  accessCode: string
}

export interface GetExamByCodeOutput {
  id: string
  title: string
  description?: string
  duration: number
  availableAnytime: boolean
  startDate?: string
  endDate?: string
  randomizeQuestions: boolean
  questions: Array<{
    id: string
    type: string
    question: string | Record<string, unknown>
    options?: string[]
    points: number
    order: number
  }>
  totalQuestions: number
  participantId: string
  accessCode: string
}

/**
 * Exam Controller Interface
 * Handles only exam CRUD operations
 */
export interface IExamController {
  createExam(req: Request, res: Response, next: NextFunction): Promise<void>
  listExams(req: Request, res: Response, next: NextFunction): Promise<void>
  getExam(req: Request, res: Response, next: NextFunction): Promise<void>
  updateExam(req: Request, res: Response, next: NextFunction): Promise<void>
  deleteExam(req: Request, res: Response, next: NextFunction): Promise<void>
  getExamResults(req: Request, res: Response, next: NextFunction): Promise<void>
  getExamByCode(req: Request, res: Response, next: NextFunction): Promise<void>
}

/**
 * Exam Service Interface
 * Handles only exam CRUD operations
 */
export interface IExamService {
  createExam(data: CreateExamInput, userId: string): Promise<CreateExamOutput>
  listExams(data: ListExamsInput, userId: string): Promise<ListExamsOutput>
  getExam(data: GetExamInput, userId: string): Promise<GetExamOutput>
  updateExam(data: UpdateExamInput, userId: string): Promise<UpdateExamOutput>
  deleteExam(data: DeleteExamInput, userId: string): Promise<DeleteExamOutput>
  getExamResults(
    data: GetExamResultsInput,
    userId: string
  ): Promise<GetExamResultsOutput>
  getExamByCode(
    data: GetExamByCodeInput,
    userId: string
  ): Promise<GetExamByCodeOutput>
}
