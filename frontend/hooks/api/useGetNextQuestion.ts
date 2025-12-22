import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

interface Question {
  id: string
  type: string
  question: string | Record<string, unknown>
  options?: string[]
  points: number
  order: number
}

interface Progress {
  answered: number
  total: number
  currentIndex: number
  percentage: number
  remaining: number
}

interface GetNextQuestionResponse {
  question: Question
  progress: Progress
  timeRemaining: number
}

export function useGetNextQuestion() {
  const api = useApi()
  const apiRef = useRef(api)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const getNextQuestion = useCallback(
    async (attemptId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await apiRef.current.get<GetNextQuestionResponse>(
          API_ENDPOINTS.ATTEMPTS.NEXT_QUESTION(attemptId),
          { requiresAuth: true }
        )

        return { success: true, data }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get next question'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    getNextQuestion,
    isLoading,
    error,
  }
}

