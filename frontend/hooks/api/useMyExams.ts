import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, type RootState } from '@/store/store'
import { ENV, EXAM_ATTEMPT_STATUS } from '@/constants'
import { Exam } from '@/interfaces'

interface MyExam {
  examId: string
  participantId: string
  title: string
  description?: string
  duration: number
  questionCount: number
  accessCode: string
  addedAt: string
  attemptStatus?: typeof EXAM_ATTEMPT_STATUS[keyof typeof EXAM_ATTEMPT_STATUS]
  attemptId?: string
  score?: number
  maxScore?: number
  percentage?: number
  startedAt?: string
  submittedAt?: string
  isAvailable: boolean
}

interface MyExamsResponse {
  data: MyExam[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const API_BASE_URL = ENV.API_URL

export function useMyExams(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  isAvailable?: boolean
) {
  const store = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exams, setExams] = useState<MyExam[]>([])
  const [pagination, setPagination] = useState<MyExamsResponse['pagination'] | null>(null)

  const fetchMyExams = useCallback(async () => {
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
      if (isAvailable !== undefined) params.append('isAvailable', isAvailable.toString())

      const response = await fetch(
        `${API_BASE_URL}/api/v1/exams/my-exams?${params.toString()}`,
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
        throw new Error(errorData.error?.message || `Failed to fetch exams: ${response.statusText}`)
      }

      const jsonResponse = await response.json()

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
        throw new Error(jsonResponse.error?.message || 'Failed to fetch exams')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch exams'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, status, isAvailable, store])

  useEffect(() => {
    fetchMyExams()
  }, [fetchMyExams])

  // Separate exams into taken and available
  // Backend returns 'submitted' for completed exams, but interface uses 'completed'
  const takenExams = exams.filter(
    (exam) => 
      exam.attemptStatus === EXAM_ATTEMPT_STATUS.COMPLETED ||
      exam.attemptStatus === EXAM_ATTEMPT_STATUS.SUBMITTED ||
      (exam.attemptStatus === undefined && exam.score !== undefined) // Fallback: if has score, it's taken
  )
  const availableExams = exams.filter(
    (exam) => 
      (exam.attemptStatus === EXAM_ATTEMPT_STATUS.NOT_STARTED ||
        exam.attemptStatus === undefined) && 
      exam.isAvailable
  )

  return {
    fetchMyExams,
    exams,
    takenExams,
    availableExams,
    pagination,
    isLoading,
    error,
  }
}

