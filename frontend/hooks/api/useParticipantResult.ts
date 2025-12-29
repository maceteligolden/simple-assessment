import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

interface ParticipantResult {
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
    startedAt?: string
    submittedAt?: string
    answers: Array<{
      questionId: string
      question: string
      questionType?: string
      userAnswer: string | string[]
      correctAnswer: string | string[]
      isCorrect: boolean
      points: number
      earnedPoints: number
    }>
  }
}

export function useParticipantResult(examId: string, participantId: string) {
  const api = useApi()
  const apiRef = useRef(api)
  const [result, setResult] = useState<ParticipantResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const fetchResult = useCallback(async () => {
    if (!examId || !participantId) return

    try {
      setIsLoading(true)
      setError(null)

      const data = await apiRef.current.get<ParticipantResult>(
        `${API_ENDPOINTS.EXAMS.BASE}/${examId}/participants/${participantId}/result`,
        { requiresAuth: true }
      )

      setResult(data)
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch participant result'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [examId, participantId])

  useEffect(() => {
    fetchResult()
  }, [fetchResult])

  return {
    result,
    isLoading,
    error,
    refetch: fetchResult,
  }
}
