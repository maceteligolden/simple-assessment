import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS, EXAM_ATTEMPT_STATUS } from '@/constants'
import { ExamParticipant } from '@/interfaces'

interface ListParticipantsOutput {
  participants: ExamParticipant[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function useParticipants(examId: string) {
  const api = useApi()
  const apiRef = useRef(api)
  const [participants, setParticipants] = useState<ExamParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const fetchParticipants = useCallback(async () => {
    if (!examId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await apiRef.current.get<ListParticipantsOutput>(
        `${API_ENDPOINTS.EXAMS.BASE}/${examId}/participants`,
        { requiresAuth: true }
      )

      // Map backend response to frontend interface
      // Backend returns: { participants: [...], pagination: {...} }
      const backendParticipants = response.participants || []
      const mappedParticipants: ExamParticipant[] = backendParticipants.map(
        (p: any) => ({
          id: p.id,
          examId: examId,
          email: p.email,
          accessCode: p.accessCode,
          hasStarted:
            p.isUsed ||
            p.attemptStatus === EXAM_ATTEMPT_STATUS.IN_PROGRESS ||
            false,
          hasCompleted:
            p.attemptStatus === EXAM_ATTEMPT_STATUS.COMPLETED ||
            p.attemptStatus === EXAM_ATTEMPT_STATUS.SUBMITTED ||
            false,
          score: p.score,
          maxScore: p.maxScore,
          startedAt: p.startedAt,
          completedAt: p.submittedAt,
          createdAt: p.addedAt || p.createdAt,
        })
      )

      setParticipants(mappedParticipants)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch participants'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [examId])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  return {
    participants,
    isLoading,
    error,
    refetch: fetchParticipants,
  }
}
