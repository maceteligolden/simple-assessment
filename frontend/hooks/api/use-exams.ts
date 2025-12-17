import { useState, useEffect, useCallback } from 'react'
import { useApi } from './use-api'
import { API_ENDPOINTS, BYPASS_AUTH } from '@/constants'
import { Exam } from '@/interfaces'

export function useExams() {
  const api = useApi()
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(false)
      setError(null)
      const data = await api.get<Exam[] | { exams: Exam[] }>(
        API_ENDPOINTS.EXAMS.BASE,
        { requiresAuth: !BYPASS_AUTH }
      )
      // Handle both array response and object with exams property
      const examsList = Array.isArray(data) ? data : data.exams || []
      setExams(examsList)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch exams'
      setError(errorMessage)
      // In test mode, set empty array instead of showing error
      if (BYPASS_AUTH) {
        setExams([])
      } else {
        setExams([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  return {
    exams,
    isLoading,
    error,
    refetch: fetchExams,
  }
}

