import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

interface SubmitExamResponse {
  attemptId: string
  score: number
  maxScore: number
  percentage: number
}

export function useSubmitExam() {
  const api = useApi()
  const apiRef = useRef(api)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const submitExam = useCallback(
    async (attemptId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await apiRef.current.post<SubmitExamResponse>(
          API_ENDPOINTS.EXAMS.SUBMIT(attemptId),
          {},
          { requiresAuth: true }
        )

        return { success: true, data }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit exam'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [api]
  )

  return {
    submitExam,
    isLoading,
    error,
  }
}
