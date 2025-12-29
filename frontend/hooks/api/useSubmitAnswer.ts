import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

interface SubmitAnswerResponse {
  message: string
  timeRemaining: number
  progress: {
    answered: number
    total: number
  }
}

export function useSubmitAnswer() {
  const api = useApi()
  const apiRef = useRef(api)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const submitAnswer = useCallback(
    async (
      attemptId: string,
      questionId: string,
      answer: string | string[]
    ) => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await apiRef.current.put<SubmitAnswerResponse>(
          API_ENDPOINTS.ATTEMPTS.SUBMIT_ANSWER(attemptId, questionId),
          { answer },
          { requiresAuth: true }
        )

        return { success: true, data }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit answer'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [api]
  )

  return {
    submitAnswer,
    isLoading,
    error,
  }
}
