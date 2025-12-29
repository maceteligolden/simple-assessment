import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, type RootState } from '@/store/store'
import { useApi } from './useApi'
import { API_ENDPOINTS, ENV } from '@/constants'

interface MyResult {
  attemptId: string
  examId: string
  examTitle: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  passPercentage: number
  submittedAt: string
  status: string
}

interface MyResultsResponse {
  data: MyResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function useMyResults() {
  const api = useApi()
  const apiRef = useRef(api)
  const store = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<MyResult[]>([])
  const [pagination, setPagination] = useState<
    MyResultsResponse['pagination'] | null
  >(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const fetchResults = useCallback(
    async (page: number = 1, limit: number = 10) => {
      try {
        setIsLoading(true)
        setError(null)

        // Use direct fetch to get full response with meta (pagination info)
        // The useApi hook extracts data, but we need the full response with meta
        const state = store.getState() as RootState
        const accessToken = state.auth.accessToken

        const response = await fetch(
          `${ENV.API_URL}/api/v1/exams/results/my-results?page=${page}&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            credentials: 'include',
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error?.message ||
              `Failed to fetch results: ${response.statusText}`
          )
        }

        const jsonResponse = await response.json()

        // Backend returns: { success: true, data: MyResult[], meta: { page, limit, total, ... } }
        if (jsonResponse.success && jsonResponse.data) {
          setResults(jsonResponse.data || [])

          // Extract pagination from meta
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
            jsonResponse.error?.message || 'Failed to fetch results'
          )
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch results'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    fetchResults,
    results,
    pagination,
    isLoading,
    error,
  }
}
