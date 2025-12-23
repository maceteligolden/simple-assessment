export type QuestionType =
  | 'multiple-choice'
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
}

// Multiple choice question
export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice'
  options: string[]
  correctAnswer: string // Index of correct option
}

// Union type for all question types
export type Question = MultipleChoiceQuestion // Add other types as needed

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
  passPercentage: number // Pass mark percentage (1-100)
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
