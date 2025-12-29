import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'

interface AddParticipantInput {
  email: string
}

interface AddParticipantOutput {
  id: string
  email: string
  accessCode: string
  addedAt: string
}

export function useAddParticipant(examId: string, onSuccess?: () => void) {
  const api = useApi()
  const apiRef = useRef(api)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRef.current = api
  }, [api])

  const addParticipant = useCallback(
    async (email: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await apiRef.current.post<AddParticipantOutput>(
          `${API_ENDPOINTS.EXAMS.BASE}/${examId}/participants`,
          { email },
          { requiresAuth: true }
        )

        if (onSuccess) {
          onSuccess()
        }

        return { success: true, participant: response }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add participant'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [examId, onSuccess]
  )

  return {
    addParticipant,
    isLoading,
    error,
  }
}
