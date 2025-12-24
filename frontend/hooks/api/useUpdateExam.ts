import { useState, useCallback } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'
import { CreateExamDto, Exam } from '@/interfaces'

export function useUpdateExam(onSuccess?: () => void) {
  const api = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateExam = useCallback(
    async (examId: string, examData: CreateExamDto, version?: number) => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('[Update Exam] Starting update', {
          examId,
          version,
          payload: {
            title: examData.title,
            description: examData.description,
            duration: examData.timeLimit,
            availableAnytime: examData.availableAnytime,
            startDate: examData.startDate,
            endDate: examData.endDate,
            randomizeQuestions: examData.randomizeQuestions,
            showResultsImmediately: false, // Default value
          },
        })

        // Map frontend CreateExamDto to backend UpdateExamInput format
        const updatePayload: any = {
          title: examData.title,
          description: examData.description || undefined,
          duration: examData.timeLimit,
          availableAnytime: examData.availableAnytime,
          randomizeQuestions: examData.randomizeQuestions,
        }

        // Include version for optimistic locking if provided
        if (version !== undefined) {
          updatePayload.version = version
        }

        // Only include dates if not availableAnytime
        if (!examData.availableAnytime) {
          if (examData.startDate) {
            updatePayload.startDate = examData.startDate
          }
          if (examData.endDate) {
            updatePayload.endDate = examData.endDate
          }
        }

        const response = await api.put<any>(
          `${API_ENDPOINTS.EXAMS.BASE}/${examId}`,
          updatePayload,
          { requiresAuth: true }
        )

        console.log('[Update Exam] Update response', response)

        // Backend returns: { id, title, description, duration, updatedAt }
        // We need to fetch the full exam to get all fields
        // For now, create a partial Exam object from the response
        const updatedExam: Partial<Exam> = {
          id: response.id || examId,
          title: response.title,
          description: response.description,
          timeLimit: response.duration,
          updatedAt: response.updatedAt,
        }

        // Call success callback if provided (e.g., to refetch exams list)
        if (onSuccess) {
          onSuccess()
        }

        return { success: true, exam: updatedExam as Exam }
      } catch (err: any) {
        // Handle optimistic lock conflicts (409 Conflict)
        if (err?.status === 409 || err?.statusCode === 409) {
          const errorMessage =
            err?.message ||
            'Exam was modified by another user. Please refresh and try again.'
          setError(errorMessage)
          console.error('[Update Exam] Optimistic lock conflict', err)
          return {
            success: false,
            error: errorMessage,
            isConflict: true, // Flag to indicate version conflict
          }
        }

        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update exam'
        setError(errorMessage)
        console.error('[Update Exam] Error', err)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [api, onSuccess]
  )

  return {
    updateExam,
    isLoading,
    error,
  }
}

