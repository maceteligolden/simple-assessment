import { useState, useCallback } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

interface StartExamResponse {
  attemptId: string
  examId: string
  title: string
  description?: string
  duration: number
  totalQuestions: number
  startedAt: string
  timeRemaining: number
}

export function useStartExam() {
  const api = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startExam = useCallback(
    async (accessCode: string) => {
      try {
        setIsLoading(true)
        setError(null)

        // Real API call
        const data = await api.post<StartExamResponse>(
          API_ENDPOINTS.EXAMS.START,
          { accessCode: accessCode.trim().toUpperCase() },
          { requiresAuth: true }
        )

        return { success: true, data }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to start exam'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [api]
  )

  return {
    startExam,
    isLoading,
    error,
  }
}

