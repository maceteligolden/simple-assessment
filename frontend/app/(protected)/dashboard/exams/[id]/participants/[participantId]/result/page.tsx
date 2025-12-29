'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth, useParticipantResult } from '@/hooks/api'
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Award } from 'lucide-react'
import { BYPASS_AUTH } from '@/constants/test.constants'

export default function ParticipantResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const participantId = params.participantId as string
  const { isAuthenticated } = useAuth()

  const { result, isLoading, error } = useParticipantResult(
    examId,
    participantId
  )

  useEffect(() => {
    if (result) {
      console.log('Participant result response:', result)
    }
  }, [result])

  useEffect(() => {
    if (!BYPASS_AUTH && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!BYPASS_AUTH && !isAuthenticated) {
    return null
  }

  if (isLoading) {
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

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-red-500 mb-4">
                  {error || 'Result not found'}
                </p>
                <Link href={`/dashboard/exams/${examId}`}>
                  <Button>Back to Exam</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { participant, attempt } = result
  const answers = attempt?.answers || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/dashboard/exams/${examId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exam
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Participant Result</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {participant.email}
          </p>
        </div>

        {/* Summary Card */}
        {attempt && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Exam Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Score</p>
                  <p className="text-2xl font-bold">
                    {attempt.score} / {attempt.maxScore}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Percentage</p>
                  <p className="text-2xl font-bold">{attempt.percentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="text-lg font-semibold capitalize">
                    {attempt.status}
                  </p>
                </div>
                {attempt.startedAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Started At</p>
                    <p className="text-sm">
                      {new Date(attempt.startedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {attempt.submittedAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Submitted At</p>
                    <p className="text-sm">
                      {new Date(attempt.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answers */}
        <Card>
          <CardHeader>
            <CardTitle>Question Answers</CardTitle>
          </CardHeader>
          <CardContent>
            {answers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No answers submitted yet.
              </p>
            ) : (
              <div className="space-y-6">
                {answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className={`p-4 rounded-lg border-2 ${
                      answer.isCorrect
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                        : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Question {index + 1}
                        </span>
                        {answer.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {answer.earnedPoints} / {answer.points} points
                      </span>
                    </div>
                    <p className="mb-3 font-medium">{answer.question}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Your Answer:
                        </p>
                        <p
                          className={`text-sm ${
                            answer.isCorrect
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {Array.isArray(answer.userAnswer)
                            ? answer.userAnswer.join(', ')
                            : answer.userAnswer}
                        </p>
                      </div>
                      {!answer.isCorrect && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Correct Answer:
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
