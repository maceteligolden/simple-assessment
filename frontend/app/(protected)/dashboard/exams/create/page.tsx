'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreateExamForm,
  ExamPreview,
  ExamCreationSuccessModal,
} from '@/components/exam'
import { useCreateExam, useExams, useAuth } from '@/hooks/api'
import { useToast } from '@/hooks/ui/useToast'
import { CreateExamDto, Exam } from '@/interfaces'

type Step = 'form' | 'preview'

export default function CreateExamPage() {
  const router = useRouter()
  const { isExaminer, bypassAuth } = useAuth()
  const { refetch: refetchExams } = useExams()
  const { createExam, isLoading, error } = useCreateExam(() => {
    refetchExams()
  })
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [step, setStep] = useState<Step>('form')
  const [examData, setExamData] = useState<CreateExamDto | null>(null)
  const [createdExam, setCreatedExam] = useState<Exam | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    if (!bypassAuth && !isExaminer) {
      router.push('/dashboard')
    }
  }, [bypassAuth, isExaminer, router])

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      showErrorToast(error, 'Failed to create exam')
    }
  }, [error, showErrorToast])

  if (!bypassAuth && !isExaminer) {
    return null
  }

  const handleFormSubmit = (data: CreateExamDto) => {
    setExamData(data)
    setStep('preview')
  }

  const handlePreviewSubmit = async () => {
    if (!examData) return

    const result = await createExam(examData)
    if (result.success && result.exam) {
      setCreatedExam(result.exam)
      setShowSuccessModal(true)
      showSuccessToast('Exam created successfully!', 'Success')
      // Reset form
      setStep('form')
      setExamData(null)
    } else if (result.error) {
      showErrorToast(result.error, 'Failed to create exam')
    }
  }

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setCreatedExam(null)
  }

  const handleEdit = () => {
    setStep('form')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'form' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Create New Exam</h1>
            <CreateExamForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        )}

        {step === 'preview' && examData && (
          <div>
            <ExamPreview
              examData={examData}
              onEdit={handleEdit}
              onSubmit={handlePreviewSubmit}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>

      {/* Success Modal */}
      <ExamCreationSuccessModal
        exam={createdExam}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onCreateAnother={handleCreateAnother}
      />
    </div>
  )
}
