'use client'

import { useState, FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react'
import { CreateExamDto, QuestionType } from '@/interfaces'

interface CreateExamFormProps {
  onSubmit: (data: CreateExamDto) => void
  isLoading?: boolean
  initialData?: CreateExamDto
  disablePassPercentage?: boolean
}

interface Question {
  id: string
  type: QuestionType
  question: string
  options: string[]
  correctAnswer: string
}

export default function CreateExamForm({
  onSubmit,
  isLoading,
  initialData,
  disablePassPercentage = false,
}: CreateExamFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    timeLimit: initialData?.timeLimit.toString() || '',
    availableAnytime: initialData?.availableAnytime ?? true,
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    randomizeQuestions: initialData?.randomizeQuestions || false,
    passPercentage: initialData?.passPercentage?.toString() || '50',
  })

  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions.map((q, index) => ({
      id: `q-${index}-${Date.now()}`,
      type: q.type,
      question:
        typeof q.question === 'string' ? q.question : q.question.text || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer,
    })) || []
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showQuestionTypeSelector, setShowQuestionTypeSelector] =
    useState(false)

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        timeLimit: initialData.timeLimit.toString() || '',
        availableAnytime: initialData.availableAnytime ?? true,
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        randomizeQuestions: initialData.randomizeQuestions || false,
        passPercentage: initialData.passPercentage?.toString() || '50',
      })
      setQuestions(
        initialData.questions.map((q, index) => ({
          id: `q-${index}-${Date.now()}`,
          type: q.type,
          question:
            typeof q.question === 'string' ? q.question : q.question.text || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer,
        }))
      )
    }
  }, [initialData])

  // Available question types (only multiple-choice for now, but UI shows others are considered)
  const availableQuestionTypes: Array<{
    type: QuestionType
    label: string
    description: string
    available: boolean
  }> = [
    {
      type: 'multiple-choice',
      label: 'Multiple Choice',
      description: 'Select one correct answer from multiple options',
      available: true,
    },
    {
      type: 'fill-in-the-blank',
      label: 'Fill in the Blank',
      description: 'Coming soon',
      available: false,
    },
    {
      type: 'audio-response',
      label: 'Audio Response',
      description: 'Coming soon',
      available: false,
    },
    {
      type: 'short-answer',
      label: 'Short Answer',
      description: 'Coming soon',
      available: false,
    },
    {
      type: 'essay',
      label: 'Essay',
      description: 'Coming soon',
      available: false,
    },
  ]

  const addQuestion = (questionType: QuestionType = 'multiple-choice') => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        type: questionType,
        question: '',
        options: questionType === 'multiple-choice' ? ['', ''] : [],
        correctAnswer: '',
      },
    ])
    setShowQuestionTypeSelector(false)
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return
    }

    const newQuestions = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ]
    setQuestions(newQuestions)
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (
    id: string,
    field: 'question' | 'options' | 'correctAnswer',
    value: string | string[]
  ) => {
    setQuestions(
      questions.map(q => (q.id === id ? { ...q, [field]: value } : q))
    )
  }

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId ? { ...q, options: [...q.options, ''] } : q
      )
    )
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((_, i) => i !== optionIndex),
              correctAnswer:
                q.correctAnswer === optionIndex.toString()
                  ? ''
                  : q.correctAnswer,
            }
          : q
      )
    )
  }

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === optionIndex ? value : opt
              ),
            }
          : q
      )
    )
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.timeLimit || parseInt(formData.timeLimit) <= 0) {
      newErrors.timeLimit = 'Valid duration is required'
    }

    if (
      !formData.passPercentage ||
      parseInt(formData.passPercentage) < 1 ||
      parseInt(formData.passPercentage) > 100
    ) {
      newErrors.passPercentage = 'Pass percentage must be between 1 and 100'
    }

    if (!formData.availableAnytime) {
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required'
      }
      if (!formData.endDate) {
        newErrors.endDate = 'End date is required'
      }
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.startDate) >= new Date(formData.endDate)
      ) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    if (questions.length === 0) {
      newErrors.questions = 'At least one question is required'
    }

    questions.forEach((q, index) => {
      if (!q.question.trim()) {
        newErrors[`question-${q.id}`] = `Question ${index + 1} text is required`
      }
      if (q.options.length < 2) {
        newErrors[`options-${q.id}`] =
          `Question ${index + 1} needs at least 2 options`
      }
      if (q.options.some(opt => !opt.trim())) {
        newErrors[`options-${q.id}`] = `Question ${index + 1} has empty options`
      }
      if (!q.correctAnswer) {
        newErrors[`answer-${q.id}`] =
          `Question ${index + 1} needs a correct answer`
      } else {
        // Validate that correct answer is a valid option index
        const answerIndex = parseInt(q.correctAnswer, 10)
        if (
          isNaN(answerIndex) ||
          answerIndex < 0 ||
          answerIndex >= q.options.length
        ) {
          newErrors[`answer-${q.id}`] =
            `Question ${index + 1} correct answer must be one of the provided options`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const examData: CreateExamDto = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      timeLimit: parseInt(formData.timeLimit, 10),
      availableAnytime: formData.availableAnytime,
      // Only include dates if not available anytime and they are provided
      startDate: formData.availableAnytime
        ? undefined
        : formData.startDate || undefined,
      endDate: formData.availableAnytime
        ? undefined
        : formData.endDate || undefined,
      randomizeQuestions: formData.randomizeQuestions,
      passPercentage: parseInt(formData.passPercentage, 10),
      questions: questions.map(q => ({
        type: 'multiple-choice' as const, // Only multiple-choice for now
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer,
        points: 1, // Default points, can be made configurable later
      })),
    }

    onSubmit(examData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Exam Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={e =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter exam title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter exam description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor="timeLimit"
              className="block text-sm font-medium mb-2"
            >
              Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <Input
              id="timeLimit"
              type="number"
              min="1"
              value={formData.timeLimit}
              onChange={e =>
                setFormData({ ...formData, timeLimit: e.target.value })
              }
              placeholder="e.g., 60"
              className={errors.timeLimit ? 'border-red-500' : ''}
            />
            {errors.timeLimit && (
              <p className="text-sm text-red-500 mt-1">{errors.timeLimit}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="passPercentage"
              className="block text-sm font-medium mb-2"
            >
              Pass Percentage (%) <span className="text-red-500">*</span>
            </label>
            <Input
              id="passPercentage"
              type="number"
              min="1"
              max="100"
              value={formData.passPercentage}
              onChange={e =>
                setFormData({ ...formData, passPercentage: e.target.value })
              }
              placeholder="e.g., 70"
              className={errors.passPercentage ? 'border-red-500' : ''}
              disabled={disablePassPercentage}
            />
            {errors.passPercentage && (
              <p className="text-sm text-red-500 mt-1">
                {errors.passPercentage}
              </p>
            )}
            {disablePassPercentage ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Pass percentage cannot be edited. Participants have already started this exam.
            </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Minimum percentage required to pass the exam (1-100%)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="availableAnytime"
              checked={formData.availableAnytime}
              onChange={e =>
                setFormData({
                  ...formData,
                  availableAnytime: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="availableAnytime" className="text-sm font-medium">
              Available anytime
            </label>
          </div>

          {!formData.availableAnytime && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium mb-2"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={e =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium mb-2"
                >
                  End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={e =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Questions</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="randomizeQuestions"
                  checked={formData.randomizeQuestions}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      randomizeQuestions: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="randomizeQuestions"
                  className="text-sm font-medium"
                >
                  Randomize question order
                </label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {errors.questions && (
            <p className="text-sm text-red-500">{errors.questions}</p>
          )}

          {questions.map((question, qIndex) => (
            <Card key={question.id} className="border-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <CardTitle className="text-lg">
                      Question {qIndex + 1}
                    </CardTitle>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {question.type === 'multiple-choice'
                        ? 'Multiple Choice'
                        : question.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveQuestion(qIndex, 'up')}
                        disabled={qIndex === 0}
                        className="h-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveQuestion(qIndex, 'down')}
                        disabled={qIndex === questions.length - 1}
                        className="h-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    htmlFor={`question-${question.id}`}
                  >
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`question-${question.id}`}
                    value={question.question}
                    onChange={e =>
                      updateQuestion(question.id, 'question', e.target.value)
                    }
                    placeholder="Enter your question"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                  />
                  {errors[`question-${question.id}`] && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors[`question-${question.id}`]}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Options <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Click the radio button to mark the correct answer
                    </span>
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex gap-3 items-center p-2 rounded-lg border-2 transition-colors ${
                          question.correctAnswer === optIndex.toString()
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={
                              question.correctAnswer === optIndex.toString()
                            }
                            onChange={() =>
                              updateQuestion(
                                question.id,
                                'correctAnswer',
                                optIndex.toString()
                              )
                            }
                            className="h-5 w-5 text-green-600 focus:ring-green-500"
                          />
                          <span
                            className={`text-sm font-medium ${
                              question.correctAnswer === optIndex.toString()
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {question.correctAnswer === optIndex.toString()
                              ? 'Correct Answer'
                              : 'Mark as Correct'}
                          </span>
                        </label>
                        <Input
                          value={option}
                          onChange={e =>
                            updateOption(question.id, optIndex, e.target.value)
                          }
                          placeholder={`Option ${optIndex + 1}`}
                          className="flex-1"
                          onClick={e => e.stopPropagation()}
                        />
                        {question.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(question.id, optIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                  {(errors[`options-${question.id}`] ||
                    errors[`answer-${question.id}`]) && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors[`options-${question.id}`] ||
                        errors[`answer-${question.id}`]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Question Button - at the bottom */}
          <div className="pt-4">
            {showQuestionTypeSelector ? (
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Select Question Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableQuestionTypes.map(type => (
                      <button
                        key={type.type}
                        type="button"
                        onClick={() => addQuestion(type.type)}
                        disabled={!type.available}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          type.available
                            ? 'border-primary hover:bg-primary/5 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-semibold mb-1">{type.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </div>
                        {!type.available && (
                          <div className="text-xs text-gray-400 mt-2">
                            (Coming soon)
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuestionTypeSelector(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                type="button"
                onClick={() => setShowQuestionTypeSelector(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            )}
          </div>

          {questions.length === 0 && !showQuestionTypeSelector && (
            <div className="text-center py-8 text-gray-500">
              <p>No questions added yet.</p>
              <p className="text-sm mt-2">
                Click &quot;Add Question&quot; to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? initialData
              ? 'Updating...'
              : 'Creating...'
            : 'Review Exam'}
        </Button>
      </div>
    </form>
  )
}
