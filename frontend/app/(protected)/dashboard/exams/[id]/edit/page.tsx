'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  CreateExamForm,
  ExamPreview,
  ExamCreationSuccessModal,
} from '@/components/exam'
import { useUpdateExam, useExamDetail, useAuth } from '@/hooks/api'
import { CreateExamDto, Exam } from '@/interfaces'
import { useToast } from '@/hooks/ui/useToast'
import { Loader2 } from 'lucide-react'

type Step = 'form' | 'preview'

export default function EditExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const { isExaminer, bypassAuth } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [step, setStep] = useState<Step>('form')
  const [examData, setExamData] = useState<CreateExamDto | null>(null)
  const [updatedExam, setUpdatedExam] = useState<Exam | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Fetch exam details
  const {
    exam,
    participants,
    isLoading: isLoadingExam,
    error: examError,
    refetch: refetchExam,
  } = useExamDetail(examId)

  // Update exam hook
  const { updateExam, isLoading } = useUpdateExam(() => {
    refetchExam()
  })

  useEffect(() => {
    if (!bypassAuth && !isExaminer) {
      router.push('/dashboard')
    }
  }, [bypassAuth, isExaminer, router])

  // Convert exam to CreateExamDto when exam is loaded
  useEffect(() => {
    if (exam) {
      const initialData: CreateExamDto = {
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        availableAnytime: exam.availableAnytime,
        startDate: exam.startDate,
        endDate: exam.endDate,
        randomizeQuestions: exam.randomizeQuestions,
        passPercentage: exam.passPercentage || 50,
        questions: exam.questions.map(q => {
          // Map question from Exam format to CreateExamDto format
          const questionText =
            typeof q.question === 'string'
              ? q.question
              : (q.question as any)?.text || ''

          // Map backend types to frontend types
          const questionType =
            (q.type as string) === 'multi-choice'
              ? 'multiple-choice'
              : (q.type as string) === 'multiple-select'
                ? 'multiple-select'
                : q.type

          // Handle correctAnswer based on question type
          let correctAnswer: string | string[]
          if (questionType === 'multiple-select') {
            // For multiple-select, keep as array
            correctAnswer = Array.isArray(q.correctAnswer)
              ? q.correctAnswer.map(String)
              : []
          } else {
            // For multiple-choice, use string
            correctAnswer = Array.isArray(q.correctAnswer)
              ? q.correctAnswer[0] || '0'
              : String(q.correctAnswer || '0')
          }

          return {
            type: questionType as 'multiple-choice' | 'multiple-select',
            question: questionText,
            options: q.options || [],
            correctAnswer,
            points: q.points || 1,
          }
        }),
      }
      setExamData(initialData)
    }
  }, [exam])

  if (!bypassAuth && !isExaminer) {
    return null
  }

  const handleFormSubmit = (data: CreateExamDto) => {
    setExamData(data)
    setStep('preview')
  }

  const handlePreviewSubmit = async () => {
    if (!examData || !examId || !exam) return

    console.log('[Edit Exam] Submitting exam update', {
      examId,
      title: examData.title,
      questionCount: examData.questions.length,
      version: exam.version,
    })

    // Pass version for optimistic locking
    const result = await updateExam(examId, examData, exam.version)

    if (result.success && result.exam) {
      // Use the original exam data to populate the success modal
      // The backend update response doesn't include questions, so we merge it with the original exam
      const updatedExamForModal: Exam = {
        ...exam,
        ...result.exam,
        questions: exam.questions, // Use original questions since update doesn't change them
        timeLimit: result.exam.timeLimit || exam.timeLimit,
      }
      setUpdatedExam(updatedExamForModal)
      setShowSuccessModal(true)
      toastSuccess('Exam updated successfully!')
      // Refetch exam to get updated data (including new version)
      refetchExam()
      // Reset form after a short delay to allow modal to show
      setTimeout(() => {
        setStep('form')
        setExamData(null)
      }, 100)
    } else {
      // Handle version conflicts
      if (result.isConflict) {
        toastError(
          'This exam was modified by another user. Refreshing the latest version...'
        )
        // Refetch to get the latest version
        refetchExam()
        // Reset to form step to allow user to review changes
        setTimeout(() => {
          setStep('form')
        }, 1000)
      } else {
        toastError(result.error || 'Failed to update exam.')
      }
    }
  }

  const handleUpdateAnother = () => {
    setShowSuccessModal(false)
    setUpdatedExam(null)
    // Reload the form with updated exam data
    if (exam) {
      const initialData: CreateExamDto = {
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        availableAnytime: exam.availableAnytime,
        startDate: exam.startDate,
        endDate: exam.endDate,
        randomizeQuestions: exam.randomizeQuestions,
        passPercentage: exam.passPercentage || 50,
        questions: exam.questions.map(q => {
          const questionText =
            typeof q.question === 'string'
              ? q.question
              : (q.question as any)?.text || ''
          // Map backend type 'multi-choice' to frontend type 'multiple-choice'
          const questionType =
            (q.type as string) === 'multi-choice' ? 'multiple-choice' : q.type
          return {
            type: questionType as 'multiple-choice',
            question: questionText,
            options: q.options || [],
            correctAnswer: Array.isArray(q.correctAnswer)
              ? q.correctAnswer[0] || '0'
              : String(q.correctAnswer || '0'),
            points: q.points || 1,
          }
        }),
      }
      setExamData(initialData)
    }
  }

  const handleEdit = () => {
    setStep('form')
  }

  const handleCancel = () => {
    router.push(`/dashboard/exams/${examId}`)
  }

  // Loading state
  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{examError || 'Exam not found'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Wait for exam data to be converted to CreateExamDto
  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'form' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Edit Exam</h1>
              <button
                onClick={handleCancel}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
            <CreateExamForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              initialData={examData}
              disablePassPercentage={
                participants?.some(p => p.hasStarted) ?? false
              }
            />
          </div>
        )}

        {step === 'preview' && examData && (
          <div>
            <ExamPreview
              examData={examData}
              onEdit={handleEdit}
              onSubmit={handlePreviewSubmit}
              isLoading={isLoading}
              isUpdate={true}
            />
          </div>
        )}
      </main>

      {/* Success Modal */}
      <ExamCreationSuccessModal
        exam={updatedExam}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onCreateAnother={handleUpdateAnother}
        isUpdate={true}
      />
    </div>
  )
}
