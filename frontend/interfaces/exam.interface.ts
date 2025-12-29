export type QuestionType =
  | 'multiple-choice'
  | 'multiple-select'
  | 'fill-in-the-blank'
  | 'audio-response'
  | 'short-answer'
  | 'essay'

// Base question interface - extensible for future question types
export interface QuestionBase {
  id: string
  type: QuestionType
  question: string | { text?: string; audio?: string; [key: string]: unknown } // Extensible for audio, images, etc.
  points: number
  order: number
  version?: number // Optimistic locking version
}

// Multiple choice question
export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice'
  options: string[]
  correctAnswer: string // Index of correct option
}

// Multiple select question
export interface MultipleSelectQuestion extends QuestionBase {
  type: 'multiple-select'
  options: string[]
  correctAnswer: string[] // Array of indices of correct options (at least 2)
}

// Fill in the blank question
export interface FillInTheBlankQuestion extends QuestionBase {
  type: 'fill-in-the-blank'
  correctAnswer: string
}

// Short answer question
export interface ShortAnswerQuestion extends QuestionBase {
  type: 'short-answer'
  correctAnswer: string
}

// Essay question
export interface EssayQuestion extends QuestionBase {
  type: 'essay'
  correctAnswer: string
}

// Union type for all question types
export type Question =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | FillInTheBlankQuestion
  | ShortAnswerQuestion
  | EssayQuestion // Add other types as needed

export interface Exam {
  id: string
  title: string
  description?: string
  creatorId: string
  questions: Question[]
  timeLimit: number // in minutes (required)
  accessCode?: string
  isPublic: boolean
  // Availability settings
  availableAnytime: boolean
  startDate?: string // ISO date string
  endDate?: string // ISO date string
  randomizeQuestions: boolean
  showResultsImmediately: boolean
  passPercentage: number // Pass mark percentage (1-100)
  version?: number // Optimistic locking version
  createdAt: string
  updatedAt: string
}

// Exam creation DTO
export interface CreateExamDto {
  title: string
  description?: string
  timeLimit: number
  availableAnytime: boolean
  startDate?: string
  endDate?: string
  randomizeQuestions: boolean
  showResultsImmediately: boolean
  passPercentage: number
  questions: Omit<Question, 'id' | 'order'>[]
}
export interface ExamAttempt {
  id: string
  examId: string
  userId: string
  answers: Record<string, string | string[]> // questionId -> answer
  score?: number
  maxScore: number
  timeSpent: number // in seconds
  submittedAt?: string
  createdAt: string
}

export interface ExamResult {
  attempt: ExamAttempt
  exam: Exam
  percentage: number
  passed: boolean
}

// Exam participant with access code
export interface ExamParticipant {
  id: string
  examId: string
  email: string
  accessCode: string
  hasStarted: boolean
  hasCompleted: boolean
  score?: number
  maxScore?: number
  startedAt?: string
  completedAt?: string
  createdAt: string
}
