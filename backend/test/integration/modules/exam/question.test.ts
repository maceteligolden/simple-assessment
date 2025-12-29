import { describe, it, expect, beforeAll } from 'vitest'
import { TestUtils, API_BASE_PATH } from '../../shared/test-utils'
import { TEST_EXAMINER } from '../../fixtures/user.fixture'

describe('Question Module Integration', () => {
  let examinerAgent: any
  let examId: string
  let questionId: string

  beforeAll(async () => {
    examinerAgent = await TestUtils.getAuthenticatedAgent('examiner')
    
    // Create an exam to add questions to
    const examResponse = await examinerAgent
      .post(`${API_BASE_PATH}/exams`)
      .send({
        title: 'Question Test Exam',
        description: 'Exam for testing questions',
        duration: 30,
        availableAnytime: true,
        passPercentage: 50,
      })
    
    examId = examResponse.body.data.id
  })

  describe('POST /exams/:id/questions', () => {
    it('should add a multi-choice question', async () => {
      const questionData = {
        type: 'multi-choice',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: '2',
        points: 5,
      }

      const response = await examinerAgent
        .post(`${API_BASE_PATH}/exams/${examId}/questions`)
        .send(questionData)

      expect(response.status).toBe(201)
      expect(response.body.data.question).toBe(questionData.question)
      expect(response.body.data.type).toBe(questionData.type)
      questionId = response.body.data.id
    })

    it('should add a multiple-select question', async () => {
      const questionData = {
        type: 'multiple-select',
        question: 'Select the primary colors',
        options: ['Red', 'Green', 'Blue', 'Yellow'],
        correctAnswer: ['0', '2', '3'],
        points: 10,
      }

      const response = await examinerAgent
        .post(`${API_BASE_PATH}/exams/${examId}/questions`)
        .send(questionData)

      expect(response.status).toBe(201)
      expect(response.body.data.type).toBe('multiple-select')
    })
  })

  describe('PUT /exams/:id/questions/:questionId', () => {
    it('should update a question', async () => {
      const updateData = {
        question: 'What is the capital of France? (Updated)',
        points: 10,
      }

      const response = await examinerAgent
        .put(`${API_BASE_PATH}/exams/${examId}/questions/${questionId}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.question).toBe(updateData.question)
      expect(response.body.data.points).toBe(10)
    })
  })

  describe('DELETE /exams/:id/questions/:questionId', () => {
    it('should delete a question', async () => {
      const response = await examinerAgent
        .delete(`${API_BASE_PATH}/exams/${examId}/questions/${questionId}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
