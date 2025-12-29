'use client'

import { MultipleSelectQuestion as MultipleSelectQuestionType } from '@/interfaces'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

interface MultipleSelectQuestionRendererProps {
  question: MultipleSelectQuestionType
  answer: string[] | undefined
  onAnswerChange: (answer: string[]) => void
  questionNumber: number
}

export function MultipleSelectQuestionRenderer({
  question,
  answer,
  onAnswerChange,
  questionNumber,
}: MultipleSelectQuestionRendererProps) {
  const questionText =
    typeof question.question === 'string'
      ? question.question
      : question.question.text || ''

  // Get selected answers as array of indices
  const selectedAnswers = answer || []
  const minSelections = 2 // Minimum required correct answers
  const maxSelections = question.options.length // Maximum possible selections

  const handleOptionToggle = (index: string) => {
    const currentAnswers = selectedAnswers
    if (currentAnswers.includes(index)) {
      // Remove if already selected
      onAnswerChange(currentAnswers.filter(ans => ans !== index))
    } else {
      // Add if not selected
      onAnswerChange([...currentAnswers, index])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Question {questionNumber}</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          {questionText}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {question.points} {question.points === 1 ? 'point' : 'points'}
          </span>
          <span className="text-blue-600 dark:text-blue-400">
            Select {minSelections} to {maxSelections} answers
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            ({selectedAnswers.length} selected)
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const indexStr = index.toString()
              const isSelected = selectedAnswers.includes(indexStr)
              return (
                <label
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleOptionToggle(indexStr)}
                    className="h-5 w-5"
                  />
                  <span className="flex-1 text-base">{option}</span>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
