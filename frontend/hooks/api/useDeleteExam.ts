import { useState, useCallback } from 'react'
import { useAppStore, type RootState } from '@/store/store'
import { API_ENDPOINTS, ENV } from '@/constants'
import { useToast } from '@/hooks/ui/useToast'

const API_BASE_URL = ENV.API_URL

export function useDeleteExam(onSuccess?: () => void) {
  const store = useAppStore()
  const { success: toastSuccess, error: toastError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteExam = useCallback(
    async (examId: string, password: string) => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('[Delete Exam] Deleting exam', {
          examId,
          endpoint: `${API_ENDPOINTS.EXAMS.BASE}/${examId}`,
        })

        // Use fetch directly for DELETE with body since useApi delete doesn't support body
        const currentAccessToken = (store.getState() as RootState).auth
          .accessToken

        // Backend doesn't require password, but we send it for potential future validation
        // If backend doesn't use it, it will be ignored
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.EXAMS.BASE}/${examId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(currentAccessToken
                ? { Authorization: `Bearer ${currentAccessToken}` }
                : {}),
            },
            ...(password ? { body: JSON.stringify({ password }) } : {}),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error?.message ||
              errorData.message ||
              `HTTP error! status: ${response.status}`
          )
        }

        console.log('[Delete Exam] Exam deleted successfully', { examId })

        toastSuccess('Exam deleted successfully')

        // Call success callback if provided (e.g., to redirect or refetch exams list)
        if (onSuccess) {
          onSuccess()
        }

        return { success: true }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete exam'
        console.error('[Delete Exam] Error deleting exam', {
          examId,
          error: err,
          errorMessage,
        })
        setError(errorMessage)
        toastError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, toastSuccess, toastError]
  )

  return {
    deleteExam,
    isLoading,
    error,
  }
}
