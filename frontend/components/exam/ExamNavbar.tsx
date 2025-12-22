'use client'

import { Clock, FileText } from 'lucide-react'

interface ExamNavbarProps {
  timeRemaining: number // in seconds
  currentQuestion: number
  totalQuestions: number
  examTitle: string
}

export function ExamNavbar({
  timeRemaining,
  currentQuestion,
  totalQuestions,
  examTitle,
}: ExamNavbarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isTimeLow = timeRemaining < 300 // Less than 5 minutes

  return (
    <nav className="border-b bg-white dark:bg-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold truncate max-w-xs">
              {examTitle}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">
                Question {currentQuestion} of {totalQuestions}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isTimeLow
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span className="text-lg font-bold font-mono">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
