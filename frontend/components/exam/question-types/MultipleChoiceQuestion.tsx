'use client'

import { MultipleChoiceQuestion as MCQType } from '@/interfaces'
import { Card, CardContent } from '@/components/ui/card'

interface MultipleChoiceQuestionRendererProps {
  question: MCQType
  answer: string | undefined
  onAnswerChange: (answer: string) => void
  questionNumber: number
}

export function MultipleChoiceQuestionRenderer({
  question,
  answer,
  onAnswerChange,
  questionNumber,
}: MultipleChoiceQuestionRendererProps) {
  const questionText =
    typeof question.question === 'string'
      ? question.question
      : question.question.text || ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Question {questionNumber}</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          {questionText}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {question.points} {question.points === 1 ? 'point' : 'points'}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = answer === index.toString()
              return (
                <label
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={index.toString()}
                    checked={isSelected}
                    onChange={() => onAnswerChange(index.toString())}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 focus:ring-2"
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
