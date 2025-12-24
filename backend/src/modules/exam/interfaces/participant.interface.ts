import { Request, Response, NextFunction } from 'express'
import { PaginationInput } from '../../../shared/interfaces/pagination.interface'
import { PARTICIPANT_ATTEMPT_STATUS } from '../../../shared/constants'

/**
 * Participant Interfaces
 * Following the Input/Output naming convention for business logic
 * Controllers extract fields from request and pass clean data to services
 */

// Add Participant
export interface AddParticipantInput {
  examId: string
  email: string
}

export interface AddParticipantOutput {
  id: string
  email: string
  accessCode: string
  addedAt: string
}

// Remove Participant
export interface RemoveParticipantInput {
  examId: string
  participantId: string
}

export interface RemoveParticipantOutput {
  message: string
}

// List Participants
export interface ListParticipantsInput extends PaginationInput {
  examId: string
  search?: string
}

export interface ListParticipantsOutput {
  data: Array<{
    id: string
    email: string
    accessCode: string
    isUsed: boolean
    addedAt: string
    attemptStatus?: typeof PARTICIPANT_ATTEMPT_STATUS[keyof typeof PARTICIPANT_ATTEMPT_STATUS]
    score?: number
    maxScore?: number
    percentage?: number
    startedAt?: string
    submittedAt?: string
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

// Get Participant Result
export interface GetParticipantResultInput {
  examId: string
  participantId: string
}

export interface GetParticipantResultOutput {
  participant: {
    id: string
    email: string
    accessCode: string
    addedAt: string
  }
  attempt?: {
    attemptId: string
    status: string
    score: number
    maxScore: number
    percentage: number
    startedAt: string
    submittedAt?: string
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
}

// Get My Exams (for participant)
export interface GetMyExamsInput extends PaginationInput {
  status?: typeof PARTICIPANT_ATTEMPT_STATUS[keyof typeof PARTICIPANT_ATTEMPT_STATUS]
  search?: string
  isAvailable?: boolean
}

export interface GetMyExamsOutput {
  data: Array<{
    examId: string
    participantId: string
    title: string
    description?: string
    duration: number
    questionCount: number
    accessCode: string
    addedAt: string
    attemptStatus?: typeof PARTICIPANT_ATTEMPT_STATUS[keyof typeof PARTICIPANT_ATTEMPT_STATUS]
    attemptId?: string
    score?: number
    maxScore?: number
    percentage?: number
    startedAt?: string
    submittedAt?: string
    isAvailable: boolean
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
 * Exam Participant Controller Interface
 */
export interface IExamParticipantController {
  addParticipant(req: Request, res: Response, next: NextFunction): Promise<void>
  removeParticipant(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>
  listParticipants(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>
  getParticipantResult(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>
  getMyExams(req: Request, res: Response, next: NextFunction): Promise<void>
  getMyNotStartedExams(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>
}

/**
 * Exam Participant Service Interface
 */
export interface IExamParticipantService {
  addParticipant(
    data: AddParticipantInput,
    userId: string
  ): Promise<AddParticipantOutput>
  removeParticipant(
    data: RemoveParticipantInput,
    userId: string
  ): Promise<RemoveParticipantOutput>
  listParticipants(
    data: ListParticipantsInput,
    userId: string
  ): Promise<ListParticipantsOutput>
  getParticipantResult(
    data: GetParticipantResultInput,
    userId: string
  ): Promise<GetParticipantResultOutput>
  getMyExams(data: GetMyExamsInput, userId: string): Promise<GetMyExamsOutput>
}
