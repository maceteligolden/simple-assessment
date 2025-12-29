'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExamResult } from '@/interfaces'
import { CheckCircle2, XCircle, Award, TrendingUp } from 'lucide-react'

// Mock exam result data
const mockExamResult: ExamResult = {
  attempt: {
    id: 'attempt-1',
    examId: '1',
    userId: 'user-1',
    answers: {
      '1': '0', // Correct
      '2': '2', // Correct
      '3': '1', // Correct
    },
    score: 3,
    maxScore: 3,
    timeSpent: 1200, // 20 minutes in seconds
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  exam: {
    id: '1',
    title: 'Introduction to Web Development',
    description:
      'This exam covers the fundamentals of web development including HTML, CSS, and JavaScript basics.',
    creatorId: '1',
    questions: [
      {
        id: '1',
        type: 'multiple-choice',
        question: 'What does HTML stand for?',
        options: [
          'HyperText Markup Language',
          'HighText Machine Language',
          'HyperText and Links Markup Language',
          'Home Tool Markup Language',
        ],
        correctAnswer: '0',
        points: 1,
        order: 1,
      },
      {
        id: '2',
        type: 'multiple-choice',
        question: 'Which CSS property is used to change the text color?',
        options: ['font-color', 'text-color', 'color', 'text-style'],
        correctAnswer: '2',
        points: 1,
        order: 2,
      },
      {
        id: '3',
        type: 'multiple-choice',
        question: 'What is the correct way to declare a JavaScript variable?',
        options: ['variable name;', 'var name;', 'v name;', 'variable = name;'],
        correctAnswer: '1',
        points: 1,
        order: 3,
      },
    ],
    timeLimit: 60,
    isPublic: true,
    availableAnytime: true,
    randomizeQuestions: false,
    passPercentage: 70,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  percentage: 100,
  passed: true,
}

export default function ExamResultsPage() {
  const router = useRouter()
  const [isMarking, setIsMarking] = useState(true)
  const [result, setResult] = useState<ExamResult | null>(null)

  useEffect(() => {
    // Simulate marking process
    const timer = setTimeout(() => {
      setIsMarking(false)
      setResult(mockExamResult)
      console.log('Exam results (mock) response:', mockExamResult)
    }, 2000) // 2 second delay to simulate marking

    return () => clearTimeout(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isMarking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Marking Your Exam</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please wait while we grade your answers...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!result) {
    return null
  }

  const { attempt, exam, percentage, passed } = result

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Result Header */}
        <Card className="mb-6">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {passed ? (
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                    <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
                    <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
                <h2 className="text-2xl font-semibold mb-4">
                  {passed ? 'Congratulations! You Passed!' : 'Exam Completed'}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Overall Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {percentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Score Percentage
                </div>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {attempt.score} / {attempt.maxScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Points Earned
                </div>
              </div>
              <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {formatTime(attempt.timeSpent)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Time Taken
                </div>
              </div>
              <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                  {exam.passPercentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Pass Mark
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Question Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exam.questions.map((question, index) => {
                const userAnswer = attempt.answers[question.id]
                const isCorrect = userAnswer === question.correctAnswer
                const questionText =
                  typeof question.question === 'string'
                    ? question.question
                    : question.question.text || ''

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Question {index + 1}
                        </span>
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {isCorrect ? question.points : 0} / {question.points}{' '}
                        pts
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {questionText}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Your Answer:{' '}
                        </span>
                        <span
                          className={`text-sm ${
                            isCorrect
                              ? 'text-green-700 dark:text-green-300 font-medium'
                              : 'text-red-700 dark:text-red-300 font-medium'
                          }`}
                        >
                          {question.options[parseInt(userAnswer as string)]}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Correct Answer:{' '}
                          </span>
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                            {question.options[parseInt(question.correctAnswer)]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push('/dashboard/results')}>
            View All Results
          </Button>
        </div>
      </main>
    </div>
  )
}
