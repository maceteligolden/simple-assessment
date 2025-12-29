import { useState, useCallback } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'
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
  showResultsImmediately: true,
  passPercentage: 70,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
}

// Mock access codes for testing
const MOCK_ACCESS_CODES: Record<string, Exam> = {
  'JOHN-DOE-2024': mockExam,
  'JANE-SMITH-2024': mockExam,
  'BOB-JOHNSON-2024': mockExam,
  'TEST-CODE': mockExam,
}

export function useExamByCode() {
  const api = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)

  const fetchExamByCode = useCallback(
    async (accessCode: string) => {
      try {
        setIsLoading(true)
        setError(null)
        setExam(null)

        // Mock data for testing
        if (MOCK_ACCESS_CODES[accessCode]) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500))
          setExam(MOCK_ACCESS_CODES[accessCode])
          return { success: true, exam: MOCK_ACCESS_CODES[accessCode] }
        }

        // Real API call
        const data = await api.get<any>(
          API_ENDPOINTS.EXAMS.BY_CODE(accessCode),
          { requiresAuth: true }
        )

        // Map backend response to frontend Exam interface
        const mappedExam: Exam = {
          id: data.id,
          title: data.title,
          description: data.description,
          creatorId: '', // Not provided in by-code response
          questions: data.questions || [],
          timeLimit: data.duration, // Backend uses 'duration', frontend uses 'timeLimit'
          isPublic: false, // Default value
          availableAnytime: data.availableAnytime,
          startDate: data.startDate,
          endDate: data.endDate,
          randomizeQuestions: data.randomizeQuestions,
          showResultsImmediately: data.showResultsImmediately ?? true,
          passPercentage: data.passPercentage || 50,
          createdAt: '', // Not provided in by-code response
          updatedAt: '', // Not provided in by-code response
        }

        setExam(mappedExam)
        return { success: true, exam: mappedExam }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Invalid access code'
        setError(errorMessage)
        setExam(null)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [api]
  )

  const reset = useCallback(() => {
    setExam(null)
    setError(null)
  }, [])

  return {
    fetchExamByCode,
    exam,
    isLoading,
    error,
    reset,
  }
}
