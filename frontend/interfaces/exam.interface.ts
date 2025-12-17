export type QuestionType = 'multiple-choice' | 'short-answer' | 'essay'

export interface Question {
  id: string
  type: QuestionType
  question: string
  options?: string[] // For multiple choice
  correctAnswer?: string | string[] // For multiple choice or short answer
  points: number
  order: number
}

export interface Exam {
  id: string
  title: string
  description?: string
  creatorId: string
  questions: Question[]
  timeLimit?: number // in minutes
  accessCode?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
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

