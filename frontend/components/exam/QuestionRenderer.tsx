'use client'

import { Question } from '@/interfaces'
import { MultipleChoiceQuestionRenderer } from './question-types/MultipleChoiceQuestion'

interface QuestionRendererProps {
  question: Question
  answer: string | string[] | undefined
  onAnswerChange: (answer: string | string[]) => void
  questionNumber: number
}

export function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  questionNumber,
}: QuestionRendererProps) {
  // Render based on question type
  // Currently only multiple-choice is supported
  if (question.type === 'multiple-choice') {
    return (
      <MultipleChoiceQuestionRenderer
        question={question}
        answer={answer as string | undefined}
        onAnswerChange={ans => onAnswerChange(ans)}
        questionNumber={questionNumber}
      />
    )
  }

  // Fallback for unsupported question types
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p className="text-red-800 dark:text-red-300">
        Unknown question type: {question.type}
      </p>
    </div>
  )
}
