import { useState, useCallback } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'
import { CreateExamDto, Exam } from '@/interfaces'

export function useCreateExam(onSuccess?: () => void) {
  const api = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createExam = useCallback(
    async (examData: CreateExamDto) => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('[Create Exam] Starting exam creation', {
          examTitle: examData.title,
          questionCount: examData.questions.length,
          timeLimit: examData.timeLimit,
        })

        // Step 1: Create the exam (without questions)
        // Backend expects 'duration' instead of 'timeLimit'
        const examPayload: {
          title: string
          description?: string
          duration: number
          availableAnytime: boolean
          startDate?: string
          endDate?: string
          randomizeQuestions: boolean
          showResultsImmediately: boolean
        } = {
          title: examData.title,
          duration: examData.timeLimit, // Map timeLimit to duration
          availableAnytime: examData.availableAnytime,
          randomizeQuestions: examData.randomizeQuestions ?? false,
          showResultsImmediately: false, // Default value
        }

        // Only include description if it's not empty
        if (examData.description && examData.description.trim()) {
          examPayload.description = examData.description.trim()
        }

        // Only include dates if not available anytime and they are provided
        if (!examData.availableAnytime) {
          if (examData.startDate) {
            examPayload.startDate = examData.startDate
          }
          if (examData.endDate) {
            examPayload.endDate = examData.endDate
          }
        }

        console.log('[Create Exam] Step 1: Creating exam', {
          endpoint: API_ENDPOINTS.EXAMS.BASE,
          payload: examPayload,
        })

        // Expected response structure from backend
        // Backend returns: { success: true, data: { id, title, description, duration, ... } }
        // useApi extracts the data property, so we should receive: { id, title, description, duration, ... }
        type ExamCreateResponse = {
          id: string
          title: string
          description?: string
          duration: number
          availableAnytime: boolean
          randomizeQuestions: boolean
          createdAt: string
        }

        let examResponse: ExamCreateResponse | null = null

        try {
          const rawResponse = await api.post<ExamCreateResponse>(
            API_ENDPOINTS.EXAMS.BASE,
            examPayload,
            { requiresAuth: true }
          )

          console.log('[Create Exam] Step 1: Raw API response received', {
            rawResponse,
            rawResponseType: typeof rawResponse,
            isNull: rawResponse === null,
            isUndefined: rawResponse === undefined,
            isObject: typeof rawResponse === 'object' && rawResponse !== null,
            isArray: Array.isArray(rawResponse),
            keys: rawResponse && typeof rawResponse === 'object' && !Array.isArray(rawResponse)
              ? Object.keys(rawResponse)
              : 'not an object',
          })

          examResponse = rawResponse
        } catch (apiError) {
          console.error('[Create Exam] Step 1: API call failed', {
            error: apiError,
            endpoint: API_ENDPOINTS.EXAMS.BASE,
            payload: examPayload,
          })
          throw apiError
        }

        // Validate response structure
        console.log('[Create Exam] Step 1: Validating response structure', {
          examResponse,
          examResponseType: typeof examResponse,
          examResponseKeys:
            examResponse && typeof examResponse === 'object' && !Array.isArray(examResponse)
              ? Object.keys(examResponse)
              : 'not an object',
          hasId:
            examResponse &&
            typeof examResponse === 'object' &&
            !Array.isArray(examResponse) &&
            'id' in examResponse,
          idValue:
            examResponse && typeof examResponse === 'object' && !Array.isArray(examResponse)
              ? (examResponse as any).id
              : 'N/A',
          idType:
            examResponse &&
            typeof examResponse === 'object' &&
            !Array.isArray(examResponse) &&
            'id' in examResponse
              ? typeof (examResponse as any).id
              : 'N/A',
        })

        // ResponseUtil.created returns { success: true, data: {...} }
        // useApi already extracts the data property, so examResponse should be the data object
        if (!examResponse) {
          console.error('[Create Exam] Step 1: Exam response is null/undefined', {
            examResponse,
            expectedStructure: {
              id: 'string (required)',
              title: 'string (required)',
              description: 'string (optional)',
              duration: 'number (required)',
              availableAnytime: 'boolean (required)',
              randomizeQuestions: 'boolean (required)',
              createdAt: 'string (required)',
            },
          })
          throw new Error('Invalid response from exam creation endpoint: response is null or undefined')
        }

        // Validate that response is an object (not array, not primitive)
        if (typeof examResponse !== 'object' || Array.isArray(examResponse)) {
          console.error('[Create Exam] Step 1: Exam response is not a valid object', {
            examResponse,
            examResponseType: typeof examResponse,
            isArray: Array.isArray(examResponse),
            expectedType: 'object (not array)',
          })
          throw new Error(
            `Invalid response from exam creation endpoint: expected object, got ${typeof examResponse}${Array.isArray(examResponse) ? ' (array)' : ''}`
          )
        }

        // Validate id property exists
        if (!('id' in examResponse)) {
          console.error('[Create Exam] Step 1: Exam response missing id property', {
            examResponse,
            examResponseKeys: Object.keys(examResponse),
            expectedStructure: {
              id: 'string (required)',
              title: 'string (required)',
              description: 'string (optional)',
              duration: 'number (required)',
              availableAnytime: 'boolean (required)',
              randomizeQuestions: 'boolean (required)',
              createdAt: 'string (required)',
            },
          })
          throw new Error('Invalid response from exam creation endpoint: missing exam id property')
        }

        const examId = examResponse.id

        // Validate id is a non-empty string
        if (typeof examId !== 'string' || examId.trim().length === 0) {
          console.error('[Create Exam] Step 1: Exam id is not a valid string', {
            examId,
            examIdType: typeof examId,
            examIdLength: typeof examId === 'string' ? examId.length : 'N/A',
            examIdValue: examId,
            examResponse,
          })
          throw new Error(
            `Invalid response from exam creation endpoint: exam id must be a non-empty string, got ${typeof examId}${typeof examId === 'string' ? ` (length: ${examId.length})` : ''}`
          )
        }

        // Confirm id is being passed correctly
        console.log('[Create Exam] Step 1: Exam created successfully with valid id', {
          examId,
          examIdType: typeof examId,
          examIdLength: examId.length,
          examIdValue: examId,
          examTitle: examResponse.title,
          fullResponse: examResponse,
          idConfirmed: true,
        })

        console.log('[Create Exam] Step 2: Adding questions', {
          examId,
          questionCount: examData.questions.length,
        })

        // Step 2: Add questions sequentially to avoid order conflicts
        // Questions must be added one at a time so the backend can correctly calculate order
        for (let i = 0; i < examData.questions.length; i++) {
          const question = examData.questions[i]
          // Map frontend type 'multiple-choice' to backend type 'multi-choice'
          const backendType = question.type === 'multiple-choice' ? 'multi-choice' : question.type
          
          const questionPayload = {
            type: backendType,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points || 1,
            // Note: order is calculated by the backend based on existing questions
          }

          console.log(`[Create Exam] Step 2.${i + 1}: Adding question ${i + 1}/${examData.questions.length}`, {
            endpoint: `${API_ENDPOINTS.EXAMS.BASE}/${examId}/questions`,
            payload: {
              ...questionPayload,
              correctAnswer: typeof questionPayload.correctAnswer === 'string' 
                ? `[Index: ${questionPayload.correctAnswer}]` 
                : questionPayload.correctAnswer, // Log index instead of full answer for security
            },
          })

          const questionResponse = await api.post(
            `${API_ENDPOINTS.EXAMS.BASE}/${examId}/questions`,
            questionPayload,
            { requiresAuth: true }
          )

          console.log(`[Create Exam] Step 2.${i + 1}: Question ${i + 1} added successfully`, {
            questionResponse,
          })
        }

        // Step 3: Fetch the complete exam with questions
        console.log('[Create Exam] Step 3: Fetching complete exam details', {
          endpoint: `${API_ENDPOINTS.EXAMS.BASE}/${examId}`,
        })

        // Backend returns the exam object directly (not wrapped in { exam: ... })
        // Structure: { id, title, description, duration, questions, participants, ... }
        const examDetailResponse = await api.get<Exam>(
          `${API_ENDPOINTS.EXAMS.BASE}/${examId}`,
          { requiresAuth: true }
        )

        console.log('[Create Exam] Step 3: Raw exam detail response received', {
          examDetailResponse,
          hasId: 'id' in examDetailResponse,
          idValue: examDetailResponse?.id,
          idType: typeof examDetailResponse?.id,
          hasQuestions: 'questions' in examDetailResponse,
          questionsCount: Array.isArray(examDetailResponse?.questions)
            ? examDetailResponse.questions.length
            : 'not an array',
          hasParticipants: 'participants' in (examDetailResponse as any),
          participantsCount: Array.isArray((examDetailResponse as any)?.participants)
            ? ((examDetailResponse as any)?.participants?.length ?? 0)
            : 'not an array',
        })

        // Validate the exam detail response
        if (!examDetailResponse) {
          console.error('[Create Exam] Step 3: Exam detail response is null/undefined')
          throw new Error('Failed to fetch exam details: response is null or undefined')
        }

        if (!examDetailResponse.id || typeof examDetailResponse.id !== 'string') {
          console.error('[Create Exam] Step 3: Invalid exam id in detail response', {
            examDetailResponse,
            idValue: examDetailResponse.id,
            idType: typeof examDetailResponse.id,
          })
          throw new Error('Invalid exam ID in detail response')
        }

        // Ensure questions is an array
        if (!Array.isArray(examDetailResponse.questions)) {
          console.warn('[Create Exam] Step 3: Questions is not an array, defaulting to empty array', {
            questions: examDetailResponse.questions,
            questionsType: typeof examDetailResponse.questions,
          })
          examDetailResponse.questions = []
        }

        const completeExam = examDetailResponse

        console.log('[Create Exam] Step 3: Exam details fetched successfully', {
          examId: completeExam.id,
          examIdType: typeof completeExam.id,
          examIdLength: completeExam.id.length,
          questionCount: completeExam.questions.length,
          participantCount: Array.isArray((completeExam as any).participants)
            ? (completeExam as any).participants.length
            : 0,
          idConfirmed: true,
        })

        console.log('[Create Exam] ✅ Exam creation completed successfully', {
          examId: completeExam.id,
          title: completeExam.title,
          totalQuestions: completeExam.questions.length,
        })

        // Call success callback if provided (e.g., to refetch exams list)
        if (onSuccess) {
          onSuccess()
        }

        return { success: true, exam: completeExam }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create exam'
        
        console.error('[Create Exam] ❌ Error creating exam', {
          error: err,
          errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        })
        
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [api, onSuccess]
  )

  return {
    createExam,
    isLoading,
    error,
  }
}

