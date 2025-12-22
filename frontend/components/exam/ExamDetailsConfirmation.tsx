'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Exam } from '@/interfaces'
import { Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

interface ExamDetailsConfirmationProps {
  exam: Exam
  onConfirm: () => void
  onBack: () => void
  isLoading?: boolean
}

export function ExamDetailsConfirmation({
  exam,
  onConfirm,
  onBack,
  isLoading = false,
}: ExamDetailsConfirmationProps) {
  const totalScore = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Exam Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
            {exam.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {exam.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Number of Questions
                </p>
                <p className="text-lg font-semibold">{exam.questions.length}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Duration
                </p>
                <p className="text-lg font-semibold">
                  {exam.timeLimit} minutes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Points
                </p>
                <p className="text-lg font-semibold">{totalScore} points</p>
              </div>
            </div>

            {exam.randomizeQuestions && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Question Order
                  </p>
                  <p className="text-lg font-semibold">Randomized</p>
                </div>
              </div>
            )}
          </div>

          {!exam.availableAnytime && (exam.startDate || exam.endDate) && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                Exam Availability
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {exam.startDate &&
                  `Starts: ${new Date(exam.startDate).toLocaleString()}`}
                {exam.startDate && exam.endDate && ' • '}
                {exam.endDate &&
                  `Ends: ${new Date(exam.endDate).toLocaleString()}`}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <p className="font-medium mb-1">Important Instructions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You have {exam.timeLimit} minutes to complete this exam</li>
                <li>Once you start, the timer will begin counting down</li>
                <li>Make sure you have a stable internet connection</li>
                <li>Do not refresh or close the browser during the exam</li>
                <li>Review your answers before submitting</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            Back
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="flex-1">
            {isLoading ? 'Starting Exam...' : 'Start Exam'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
