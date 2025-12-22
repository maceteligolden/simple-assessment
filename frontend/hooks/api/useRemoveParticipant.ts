import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

export function useRemoveParticipant(examId: string, onSuccess?: () => void) {
  const api = useApi()
  const apiRef = useRef(api)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const removeParticipant = useCallback(
    async (participantId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        await apiRef.current.delete(
          `${API_ENDPOINTS.EXAMS.BASE}/participants/${participantId}`,
          { requiresAuth: true }
        )

        if (onSuccess) {
          onSuccess()
        }

        return { success: true }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove participant'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess]
  )

  return {
    removeParticipant,
    isLoading,
    error,
  }
}

