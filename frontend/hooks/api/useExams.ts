import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type RootState } from '@/store/store'
import { API_ENDPOINTS, BYPASS_AUTH, ENV } from '@/constants'
import { Exam } from '@/interfaces'

interface UseExamsOptions {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

interface BackendExam {
  id: string
  title: string
  description?: string
  duration: number
  questionCount: number
  participantCount: number
  createdAt: string
}

interface PaginatedExamsResponse {
  data: BackendExam[]
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

export function useExams(options: UseExamsOptions = {}) {
  const store = useAppStore()
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null>(null)

  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query parameters
      const queryParams = new URLSearchParams()
      if (options.search) {
        queryParams.append('search', options.search)
      }
      if (options.isActive !== undefined) {
        queryParams.append('isActive', String(options.isActive))
      }
      if (options.page) {
        queryParams.append('page', String(options.page))
      }
      if (options.limit) {
        queryParams.append('limit', String(options.limit))
      }

      const queryString = queryParams.toString()
      const endpoint = queryString
        ? `${API_ENDPOINTS.EXAMS.BASE}?${queryString}`
        : API_ENDPOINTS.EXAMS.BASE

      // Backend returns: { success: true, data: [...], meta: { page, limit, total, ... } }
      // We need to fetch the raw response to get pagination info from meta
      const currentAccessToken = (store.getState() as RootState).auth
        .accessToken

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(currentAccessToken
            ? { Authorization: `Bearer ${currentAccessToken}` }
            : {}),
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const jsonResponse = await response.json()

      // Backend returns: { success: true, data: [...], meta: { page, limit, total, ... } }
      const backendExams: BackendExam[] = jsonResponse.data || []
      const paginationData = jsonResponse.meta
        ? {
            page: jsonResponse.meta.page || 1,
            limit: jsonResponse.meta.limit || options.limit || 10,
            total: jsonResponse.meta.total || 0,
            totalPages: jsonResponse.meta.totalPages || 1,
            hasNext: jsonResponse.meta.hasNext || false,
            hasPrev: jsonResponse.meta.hasPrev || false,
          }
        : null

      // Map backend exam format to frontend Exam interface
      // Note: Backend returns questionCount and participantCount, not full arrays
      const mappedExams: (Exam & {
        questionCount: number
        participantCount: number
      })[] = backendExams.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        creatorId: '', // Will be populated from user context
        questions: [], // Questions not included in list endpoint - use questionCount for display
        timeLimit: exam.duration, // Map duration to timeLimit
        isPublic: true, // Default value
        availableAnytime: true, // Default value, will be fetched from detail endpoint
        randomizeQuestions: false, // Default value
        showResultsImmediately: true,
        passPercentage: 50,
        createdAt: exam.createdAt,
        updatedAt: exam.createdAt,
        // Store additional data for display
        questionCount: exam.questionCount,
        participantCount: exam.participantCount,
      }))

      setExams(mappedExams)
      setPagination(paginationData)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch exams'
      setError(errorMessage)
      setExams([])
      setPagination(null)
    } finally {
      setIsLoading(false)
    }
  }, [options.search, options.isActive, options.page, options.limit]) // Include options in deps

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  return {
    exams,
    isLoading,
    error,
    pagination,
    refetch: fetchExams,
  }
}
