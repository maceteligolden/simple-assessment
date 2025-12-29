'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAttemptResults } from '@/hooks/api'
import { CheckCircle2, XCircle, Award, TrendingUp, Clock } from 'lucide-react'

export default function AttemptResultsPage() {
  const router = useRouter()
  const params = useParams()
  const attemptId = params.attemptId as string
  const { fetchResults, results, isLoading, error } = useAttemptResults()
  const [isMarking, setIsMarking] = useState(true)

  useEffect(() => {
    if (attemptId) {
      fetchResults(attemptId).then(result => {
        console.log('Exam results response:', result)
        if (result.success) {
          // Simulate marking delay
          setTimeout(() => {
            setIsMarking(false)
          }, 1500)
        } else {
          setIsMarking(false)
        }
      })
    }
  }, [attemptId, fetchResults])

  if (isMarking || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Marking your exam...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please wait while we calculate your results
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">
                {error || 'Failed to load results'}
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const percentage = results.percentage
  const passPercentage = results.passPercentage ?? 70
  const passed = results.passed ?? percentage >= passPercentage

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Exam Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Award className="h-6 w-6 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Score
                  </p>
                  <p className="text-2xl font-bold">
                    {results.score} / {results.maxScore}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Percentage
                  </p>
                  <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {passed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-2xl font-bold">
                    {passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>
                    Submitted on {new Date(results.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Pass Mark: {passPercentage}%</span>
                  <span className="text-gray-400">•</span>
                  <span
                    className={
                      passed
                        ? 'text-green-600 dark:text-green-400 font-medium'
                        : 'text-red-600 dark:text-red-400 font-medium'
                    }
                  >
                    {percentage.toFixed(1)}% {passed ? '≥' : '<'} {passPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Answer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {results.answers.map((answer, index) => (
                <div
                  key={answer.questionId}
                  className={`p-4 rounded-lg border-2 ${
                    answer.isCorrect
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                      : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">
                      Question {index + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      {answer.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">
                        {answer.earnedPoints} / {answer.points} points
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {answer.question}
                  </p>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Your Answer:
                      </p>
                      <p
                        className={`p-2 rounded ${
                          answer.isCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {Array.isArray(answer.userAnswer)
                          ? answer.userAnswer.join(', ')
                          : answer.userAnswer}
                      </p>
                    </div>

                    {!answer.isCorrect && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Correct Answer:
                        </p>
                        <p className="p-2 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {Array.isArray(answer.correctAnswer)
                            ? answer.correctAnswer.join(', ')
                            : answer.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex-1"
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/dashboard/results')}
            className="flex-1"
          >
            View All Results
          </Button>
        </div>
      </main>
    </div>
  )
}
