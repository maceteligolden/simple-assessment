'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateExamDto } from '@/interfaces'
import { CheckCircle2, Clock, Calendar } from 'lucide-react'

interface ExamPreviewProps {
  examData: CreateExamDto
  onEdit: () => void
  onSubmit: () => void
  isLoading?: boolean
  isUpdate?: boolean
}

export default function ExamPreview({
  examData,
  onEdit,
  onSubmit,
  isLoading,
  isUpdate = false,
}: ExamPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exam Preview</h2>
        <Button onClick={onEdit} variant="outline">
          Edit Exam
        </Button>
      </div>

      {/* Exam Information */}
      <Card>
        <CardHeader>
          <CardTitle>{examData.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {examData.description && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {examData.description}
              </p>
            </div>
          )}

          <div className="flex gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <span className="font-medium">Duration:</span>{' '}
                {examData.timeLimit} minutes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <span className="font-medium">Availability:</span>{' '}
                {examData.availableAnytime
                  ? 'Anytime'
                  : `${new Date(examData.startDate!).toLocaleString()} - ${new Date(examData.endDate!).toLocaleString()}`}
              </span>
            </div>
            {examData.randomizeQuestions && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  <span className="font-medium">Question Order:</span>{' '}
                  Randomized
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm">
                <span className="font-medium">Pass Percentage:</span>{' '}
                {examData.passPercentage}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">
                <span className="font-medium">Results:</span>{' '}
                {examData.showResultsImmediately
                  ? 'Shown immediately'
                  : 'Hidden after submission'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({examData.questions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {examData.questions.map((question, index) => (
            <div key={index} className="border-l-4 border-primary pl-4 py-2">
              <div className="flex items-start gap-2 mb-3">
                <span className="font-semibold text-sm">
                  Question {index + 1}:
                </span>
                <p className="flex-1">
                  {typeof question.question === 'string'
                    ? question.question
                    : question.question.text || ''}
                </p>
              </div>

              {((question.type as string) === 'multiple-choice' ||
                (question.type as string) === 'multi-choice' ||
                (question.type as string) === 'multiple-select') && (
                <div className="ml-6 space-y-2">
                  {((question as any).options || []).map(
                    (option: string, optIndex: number) => {
                      const optIndexStr = optIndex.toString()
                      const isCorrect =
                        (question.type as string) === 'multiple-choice' ||
                        (question.type as string) === 'multi-choice'
                          ? String(question.correctAnswer) === optIndexStr
                          : (question.type as string) === 'multiple-select'
                            ? Array.isArray(question.correctAnswer) &&
                              question.correctAnswer
                                .map(String)
                                .includes(optIndexStr)
                            : false

                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2 p-2 rounded ${
                            isCorrect
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          {isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                          <span
                            className={
                              isCorrect
                                ? 'font-medium text-green-700 dark:text-green-300'
                                : ''
                            }
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </span>
                          {isCorrect && (
                            <span className="ml-auto text-xs text-green-600 dark:text-green-400">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      )
                    }
                  )}
                  {(question.type as string) === 'multiple-select' && (
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      Multiple Select: Select all correct answers (
                      {Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.length
                        : 0}{' '}
                      correct)
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 ml-6 text-xs text-gray-500">
                Points: {question.points}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button onClick={onEdit} variant="outline">
          Back to Edit
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading
            ? isUpdate
              ? 'Updating Exam...'
              : 'Creating Exam...'
            : isUpdate
              ? 'Update Exam'
              : 'Create Exam'}
        </Button>
      </div>
    </div>
  )
}
