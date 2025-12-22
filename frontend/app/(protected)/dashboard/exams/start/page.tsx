'use client'

import { useState, FormEvent, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExamByCode, useStartExam } from '@/hooks/api'
import { ExamDetailsConfirmation } from '@/components/exam'
import { Key } from 'lucide-react'
import { useToast } from '@/hooks/ui/useToast'

function StartExamContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success: toastSuccess, error: toastError } = useToast()
  const {
    fetchExamByCode,
    exam,
    isLoading: isLoadingExam,
    error,
    reset,
  } = useExamByCode()
  const { startExam, isLoading: isStartingExam } = useStartExam()
  const [accessCode, setAccessCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const lastFetchedCodeRef = useRef<string>('')

  // Check for code in URL query params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      const normalizedCode = codeFromUrl.toUpperCase()
      // Only fetch if this is a different code than what we last fetched
      if (normalizedCode !== lastFetchedCodeRef.current) {
        setAccessCode(normalizedCode)
        lastFetchedCodeRef.current = normalizedCode
        // Reset exam state before fetching new one
        reset()
        // Auto-fetch exam details if code is provided
        fetchExamByCode(normalizedCode)
      } else if (normalizedCode !== accessCode.toUpperCase()) {
        // Update accessCode state if it's different, but don't re-fetch
        setAccessCode(normalizedCode)
      }
    } else {
      // Reset if no code in URL
      if (accessCode) {
        setAccessCode('')
        lastFetchedCodeRef.current = ''
        reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // Only depend on searchParams to avoid infinite loops

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCodeError('')

    if (!accessCode.trim()) {
      setCodeError('Access code is required')
      return
    }

    const result = await fetchExamByCode(accessCode.trim().toUpperCase())
    if (!result.success) {
      setCodeError(result.error || 'Invalid access code')
    }
  }

  const handleConfirm = async () => {
    if (!exam || !accessCode.trim()) {
      return
    }

    const result = await startExam(accessCode.trim().toUpperCase())

    if (result.success && result.data) {
      toastSuccess('Good luck with your exam!', 'Exam Started')
      // Navigate to take exam page with attemptId
      router.push(`/dashboard/exams/attempts/${result.data.attemptId}/take`)
    } else {
      toastError(
        result.error || 'An error occurred while starting the exam',
        'Failed to Start Exam'
      )
    }
  }

  const handleBack = () => {
    reset()
    setAccessCode('')
    setCodeError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!exam ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Enter Exam Access Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="accessCode"
                    className="block text-sm font-medium mb-2"
                  >
                    Access Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={e => {
                      setAccessCode(e.target.value.toUpperCase())
                      setCodeError('')
                    }}
                    placeholder="Enter your exam access code"
                    className={codeError || error ? 'border-red-500' : ''}
                    disabled={isLoadingExam}
                    autoFocus
                  />
                  {(codeError || error) && (
                    <p className="text-sm text-red-500 mt-1">
                      {codeError || error}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Enter the unique access code provided by your instructor to
                    start the exam.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoadingExam}
                  className="w-full"
                >
                  {isLoadingExam ? 'Validating...' : 'Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <ExamDetailsConfirmation
            exam={exam}
            onConfirm={handleConfirm}
            onBack={handleBack}
            isLoading={isStartingExam}
          />
        )}
      </main>
    </div>
  )
}

export default function StartExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <StartExamContent />
    </Suspense>
  )
}
