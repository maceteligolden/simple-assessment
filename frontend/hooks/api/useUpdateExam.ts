import { useState, useCallback } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'
import { CreateExamDto, Exam } from '@/interfaces'

export function useUpdateExam(onSuccess?: () => void) {
  const api = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateExam = useCallback(
    async (examId: string, examData: CreateExamDto) => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('[Update Exam] Starting update', {
          examId,
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
      } catch (err) {
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

