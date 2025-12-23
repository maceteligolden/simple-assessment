'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExamNavbar } from '@/components/exam/ExamNavbar'
import { QuestionRenderer } from '@/components/exam/QuestionRenderer'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Exam } from '@/interfaces'

// Mock exam data for testing
const mockExam: Exam = {
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
}

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  // Using static mock data
  const [exam] = useState<Exam>(mockExam)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  // Randomize questions if needed
  const questions = useMemo(() => {
    if (!exam) return []
    const qs = [...exam.questions]
    if (exam.randomizeQuestions) {
      // Simple shuffle
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[qs[i], qs[j]] = [qs[j], qs[i]]
      }
    }
    return qs
  }, [exam])

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  useEffect(() => {
    // In a real app, you'd check if the exam has already been started
    // For now, we'll just show the exam interface
  }, [])

  const handleStartExam = () => {
    if (!exam) return
    // Simulate starting exam with mock data
    setHasStarted(true)
    setTimeRemaining(exam.timeLimit * 60) // Convert minutes to seconds
  }

  const handleSubmitExam = () => {
    // TODO: Implement exam submission
    console.log('Submitting exam with answers:', answers)
    router.push(`/dashboard/exams/${examId}/results`)
  }

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && hasStarted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Auto-submit when time runs out
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining, hasStarted])

  useEffect(() => {
    if (timeRemaining === 0 && hasStarted && exam) {
      // Auto-submit when time runs out
      console.log('Time expired. Submitting exam with answers:', answers)
      router.push(`/dashboard/exams/${examId}/results`)
    }
  }, [timeRemaining, hasStarted, exam, examId, router, answers])

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[]
  ) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">Exam not found</p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center space-y-6">
              <h1 className="text-3xl font-bold">{exam.title}</h1>
              {exam.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {exam.description}
                </p>
              )}
              <div className="flex justify-center gap-8 py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{exam.questions.length}</p>
                  <p className="text-sm text-gray-500">Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{exam.timeLimit}</p>
                  <p className="text-sm text-gray-500">Minutes</p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleStartExam} size="lg">
                  Start Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ExamNavbar
          timeRemaining={timeRemaining || 0}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          examTitle={exam.title}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No questions available
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ExamNavbar
        timeRemaining={timeRemaining || 0}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        examTitle={exam.title}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="py-8">
            <QuestionRenderer
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswerChange={answer =>
                handleAnswerChange(currentQuestion.id, answer)
              }
              questionNumber={currentQuestionIndex + 1}
            />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleSubmitExam} size="lg">
              End Exam
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg">
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
