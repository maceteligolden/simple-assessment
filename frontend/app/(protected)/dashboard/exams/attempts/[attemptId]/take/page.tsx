'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExamNavbar } from '@/components/exam/ExamNavbar'
import { QuestionRenderer } from '@/components/exam/QuestionRenderer'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetNextQuestion, useSubmitAnswer, useSubmitExam } from '@/hooks/api'
import { useToast } from '@/hooks/ui/useToast'
import { Question } from '@/interfaces'

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const attemptId = params.attemptId as string
  const { success: toastSuccess, error: toastError } = useToast()

  const { getNextQuestion, isLoading: isLoadingQuestion } = useGetNextQuestion()
  const { submitAnswer, isLoading: isSubmittingAnswer } = useSubmitAnswer()
  const { submitExam, isLoading: isSubmittingExam } = useSubmitExam()

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [progress, setProgress] = useState({
    answered: 0,
    total: 0,
    currentIndex: 0,
    percentage: 0,
    remaining: 0,
  })
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [answer, setAnswer] = useState<string | string[] | undefined>(undefined)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Fetch first question on mount
  useEffect(() => {
    if (attemptId) {
      fetchQuestion()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId])

  const fetchQuestion = async () => {
    const result = await getNextQuestion(attemptId)
    if (result.success && result.data) {
      // Map backend question type to frontend type and ensure proper structure
      const backendQuestion = result.data.question
      const mappedQuestion: Question = {
        id: backendQuestion.id,
        type:
          backendQuestion.type === 'multi-choice'
            ? 'multiple-choice'
            : (backendQuestion.type as any),
        question: backendQuestion.question,
        options: backendQuestion.options || [],
        points: backendQuestion.points,
        order: backendQuestion.order,
        correctAnswer: '', // Not provided by backend for security
      }

      // Debug logging
      console.log('[Take Exam] Question received:', {
        original: backendQuestion,
        mapped: mappedQuestion,
        hasOptions: !!mappedQuestion.options,
        optionsLength: mappedQuestion.options?.length,
      })

      // Validate question structure
      if (!mappedQuestion.options || mappedQuestion.options.length === 0) {
        console.error('[Take Exam] Question missing options:', mappedQuestion)
        toastError('Question data is invalid: missing options', 'Error')
        return
      }

      setCurrentQuestion(mappedQuestion)
      setProgress(result.data.progress)
      setTimeRemaining(result.data.timeRemaining)
      setAnswer(undefined)
      setHasAnswered(false)
    } else {
      toastError(result.error || 'Failed to load question', 'Error')
    }
  }

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const handleAutoSubmit = async () => {
    if (answer && currentQuestion && !hasAnswered) {
      await handleSubmitAnswer()
    }
    // Auto-submit exam when time runs out
    const result = await submitExam(attemptId)
    if (result.success && result.data) {
      router.push(`/dashboard/exams/attempts/${attemptId}/results`)
    } else {
      toastError(result.error || 'Failed to submit exam', 'Error')
    }
  }

  const handleAnswerChange = (newAnswer: string | string[]) => {
    setAnswer(newAnswer)
    setHasAnswered(false)
  }

  const handleSubmitAnswer = async (): Promise<boolean> => {
    if (!currentQuestion || !answer) {
      toastError('Please select an answer', 'Answer Required')
      return false
    }

    const result = await submitAnswer(attemptId, currentQuestion.id, answer)
    if (result.success && result.data) {
      setHasAnswered(true)
      setTimeRemaining(result.data.timeRemaining)
      // Update progress after submitting answer
      if (result.data.progress) {
        setProgress({
          ...progress,
          answered: result.data.progress.answered,
          total: result.data.progress.total,
          percentage: Math.round(
            (result.data.progress.answered / result.data.progress.total) * 100
          ),
          remaining: result.data.progress.total - result.data.progress.answered,
        })
      }
      toastSuccess('Answer saved', 'Success')
      return true
    } else {
      toastError(result.error || 'Failed to save answer', 'Error')
      return false
    }
  }

  const handleNext = async () => {
    if (!hasAnswered && answer) {
      await handleSubmitAnswer()
    }
    await fetchQuestion()
  }

  const handlePrevious = async () => {
    // For now, we can only go forward sequentially
    // Backend enforces sequential question answering
    toastError(
      'You can only navigate forward. Please answer questions in order.',
      'Navigation Restricted'
    )
  }

  const handleEndExam = async () => {
    // Save current answer if not saved yet
    if (!hasAnswered && answer && currentQuestion) {
      const saveResult = await handleSubmitAnswer()
      if (!saveResult) {
        return // Failed to save, don't proceed
      }
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Re-check progress after saving (state might have updated)
    // The backend will validate anyway, so we can proceed if we have an answer
    if (!answer && !hasAnswered) {
      toastError('Please select an answer for this question', 'Answer Required')
      return
    }

    const result = await submitExam(attemptId)
    if (result.success && result.data) {
      router.push(`/dashboard/exams/attempts/${attemptId}/results`)
    } else {
      toastError(result.error || 'Failed to submit exam', 'Error')
    }
  }

  const isLoading = isLoadingQuestion || isSubmittingAnswer || isSubmittingExam
  const isLastQuestion = progress.currentIndex >= progress.total - 1
  const isFirstQuestion = progress.currentIndex === 0
  // Calculate if all questions are answered
  // All questions are answered if:
  // 1. All questions are marked as answered in progress, OR
  // 2. We're on the last question, all previous are answered, and current question has an answer
  const allQuestionsAnswered =
    progress.answered >= progress.total ||
    (isLastQuestion && answer && progress.answered >= progress.total - 1)

  if (!currentQuestion && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No question available
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ExamNavbar
        timeRemaining={timeRemaining}
        currentQuestion={progress.currentIndex + 1}
        totalQuestions={progress.total}
        examTitle="Exam"
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="py-8">
            {isLoading && !currentQuestion ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  Loading question...
                </p>
              </div>
            ) : currentQuestion ? (
              <>
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answer}
                  onAnswerChange={handleAnswerChange}
                  questionNumber={progress.currentIndex + 1}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!answer || hasAnswered || isSubmittingAnswer}
                    variant="outline"
                  >
                    {isSubmittingAnswer
                      ? 'Saving...'
                      : hasAnswered
                        ? 'Saved'
                        : 'Save Answer'}
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={handlePrevious}
            disabled={isFirstQuestion || isLoading}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleEndExam}
              disabled={isLoading || isSubmittingExam || !allQuestionsAnswered}
              size="lg"
            >
              {isSubmittingExam ? 'Submitting...' : 'End Exam'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isLoading || !hasAnswered}
              size="lg"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Progress: {progress.answered} of {progress.total} questions answered (
          {progress.percentage}%)
        </div>
      </main>
    </div>
  )
}
