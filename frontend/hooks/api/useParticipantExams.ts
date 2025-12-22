import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type RootState } from '@/store/store'
import { ENV } from '@/constants'

interface ParticipantExam {
  examId: string
  participantId: string
  title: string
  description?: string
  duration: number
  questionCount: number
  accessCode: string
  addedAt: string
  attemptStatus?:
    | 'not_started'
    | 'in-progress'
    | 'completed'
    | 'submitted'
    | 'abandoned'
  attemptId?: string
  score?: number
  maxScore?: number
  percentage?: number
  startedAt?: string
  submittedAt?: string
  isAvailable: boolean
}

interface ParticipantExamsResponse {
  data: ParticipantExam[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const API_BASE_URL = ENV.API_URL

export function useParticipantExams(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  isAvailable?: boolean
) {
  const store = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exams, setExams] = useState<ParticipantExam[]>([])
  const [pagination, setPagination] = useState<
    ParticipantExamsResponse['pagination'] | null
  >(null)

  const fetchParticipantExams = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const state = store.getState() as RootState
      const accessToken = state.auth.accessToken

      // Build query parameters
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (isAvailable !== undefined)
        params.append('isAvailable', isAvailable.toString())

      const response = await fetch(
        `${API_BASE_URL}/api/v1/exams/participants/me?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error?.message ||
            `Failed to fetch participant exams: ${response.statusText}`
        )
      }

      const jsonResponse = await response.json()

      // Log the response for debugging
      console.log('[useParticipantExams] API Response:', {
        endpoint: '/api/v1/exams/participants/me',
        status: response.status,
        success: jsonResponse.success,
        dataLength: jsonResponse.data?.length || 0,
        pagination: jsonResponse.meta,
        fullResponse: jsonResponse,
      })

      if (jsonResponse.success && jsonResponse.data) {
        setExams(jsonResponse.data || [])

        if (jsonResponse.meta) {
          setPagination({
            page: jsonResponse.meta.page || page,
            limit: jsonResponse.meta.limit || limit,
            total: jsonResponse.meta.total || 0,
            totalPages: jsonResponse.meta.totalPages || 0,
            hasNext: jsonResponse.meta.hasNext || false,
            hasPrev: jsonResponse.meta.hasPrev || false,
          })
        } else {
          setPagination(null)
        }

        return { success: true, data: jsonResponse }
      } else {
        throw new Error(
          jsonResponse.error?.message || 'Failed to fetch participant exams'
        )
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch participant exams'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, status, isAvailable, store])

  useEffect(() => {
    fetchParticipantExams()
  }, [fetchParticipantExams])

  return {
    fetchParticipantExams,
    exams,
    pagination,
    isLoading,
    error,
  }
}
