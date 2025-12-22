import { useState, useEffect, useCallback, useRef } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'
import { Exam, ExamParticipant } from '@/interfaces'

export function useExamDetail(examId: string) {
  const api = useApi()
  const apiRef = useRef(api)
  const [exam, setExam] = useState<Exam | null>(null)
  const [participants, setParticipants] = useState<ExamParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Keep api ref up to date
  useEffect(() => {
    apiRef.current = api
  }, [api])

  const fetchExamDetail = useCallback(async () => {
    if (!examId) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Backend returns exam object directly (not wrapped in { exam: ... })
      // Structure: { id, title, description, duration, questions, participants, ... }
      const data = await apiRef.current.get<any>(
        API_ENDPOINTS.EXAMS.BY_ID(examId),
        { requiresAuth: true }
      )

      // Map backend response to frontend Exam interface
      const mappedExam: Exam = {
        id: data.id,
        title: data.title,
        description: data.description,
        creatorId: data.creatorId || '', // May not be in response
        questions: data.questions || [],
        timeLimit: data.duration, // Backend uses 'duration', frontend uses 'timeLimit'
        isPublic: false, // Default value
        availableAnytime: data.availableAnytime,
        startDate: data.startDate,
        endDate: data.endDate,
        randomizeQuestions: data.randomizeQuestions,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }

      // Map participants from backend to frontend interface
      const mappedParticipants: ExamParticipant[] = (data.participants || []).map(
        (p: any) => ({
          id: p.id,
          examId: examId,
          email: p.email,
          accessCode: p.accessCode,
          hasStarted: p.isUsed || false,
          hasCompleted: false, // Will be determined by attempt status if available
          score: undefined,
          maxScore: undefined,
          startedAt: undefined,
          completedAt: undefined,
          createdAt: p.addedAt || p.createdAt,
        })
      )

      setExam(mappedExam)
      setParticipants(mappedParticipants)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch exam details'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [examId]) // Only depend on examId, api is accessed via ref

  useEffect(() => {
    fetchExamDetail()
  }, [fetchExamDetail])

  return {
    exam,
    participants,
    isLoading,
    error,
    refetch: fetchExamDetail,
  }
}

