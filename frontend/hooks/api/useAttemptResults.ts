import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

interface AnswerDetail {
  questionId: string
  question: string
  userAnswer: string | string[]
  correctAnswer: string | string[]
  isCorrect: boolean
  points: number
  earnedPoints: number
}

interface AttemptResultsResponse {
  attemptId: string
  examId: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  passPercentage: number
  submittedAt: string
  answers: AnswerDetail[]
}

export function useAttemptResults() {
  const api = useApi()
  const apiRef = useRef(api)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AttemptResultsResponse | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const fetchResults = useCallback(async (attemptId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await apiRef.current.get<AttemptResultsResponse>(
        API_ENDPOINTS.EXAMS.RESULTS(attemptId),
        { requiresAuth: true }
      )

      setResults(data)
      return { success: true, data }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch results'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    fetchResults,
    results,
    isLoading,
    error,
  }
}

