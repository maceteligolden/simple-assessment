import { injectable, inject } from 'tsyringe'
import {
  IExamRepository,
  IQuestionRepository,
  IExamParticipantRepository,
  IExamAttemptRepository,
} from '../../../shared/repository'
import { logger, paginateArray } from '../../../shared/util'
import {
  StartExamInput,
  StartExamOutput,
  GetNextQuestionInput,
  GetNextQuestionOutput,
  SubmitAnswerInput,
  SubmitAnswerOutput,
  SubmitExamInput,
  SubmitExamOutput,
  GetAttemptResultsInput,
  GetAttemptResultsOutput,
  GetMyResultsInput,
  GetMyResultsOutput,
  IExamAttemptService,
} from '../interfaces/attempt.interface'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from '../../../shared/errors'
import { IExamAttempt, IQuestion } from '../../../shared/model'
import { QuestionFactory } from '../factory/question.factory'

/**
 * Exam Attempt Service Implementation
 * Handles all business logic related to exam attempts (taking exams)
 */
@injectable()
export class ExamAttemptService implements IExamAttemptService {
  constructor(
    @inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    @inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @inject('IExamParticipantRepository')
    private readonly participantRepository: IExamParticipantRepository,
    @inject('IExamAttemptRepository')
    private readonly attemptRepository: IExamAttemptRepository
  ) {
    logger.debug('ExamAttemptService initialized')
  }

  /**
   * Helper function to safely extract examId string from attempt
   * Handles both populated and non-populated examId
   */
  private getExamIdString(attempt: IExamAttempt): string {
    const examId = attempt.examId as any
    if (typeof examId === 'object' && examId !== null) {
      // Check if it's a populated document (has _id property)
      if ('_id' in examId) {
        return examId._id.toString()
      }
      // Otherwise it's an ObjectId
      return examId.toString()
    }
    // Fallback (shouldn't happen)
    return String(examId)
  }

  /**
   * Start exam (by access code)
   */
  async startExam(
    data: StartExamInput,
    userId: string
  ): Promise<StartExamOutput> {
    try {
      logger.info('Starting exam', { userId, accessCode: data.accessCode })

      // Find participant by access code
      const participant = await this.participantRepository.findByAccessCode(
        data.accessCode
      )

      if (!participant) {
        throw new NotFoundError('Invalid access code')
      }

      // Verify user matches participant
      if (participant.userId.toString() !== userId) {
        throw new ForbiddenError('This access code does not belong to you')
      }

      // Check if access code is already used
      if (participant.isUsed) {
        throw new BadRequestError('This access code has already been used')
      }

      // Get exam
      const exam = await this.examRepository.findById(
        participant.examId.toString()
      )

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if exam is available
      if (!exam.availableAnytime) {
        const now = new Date()
        if (exam.startDate && now < exam.startDate) {
          throw new BadRequestError('Exam has not started yet')
        }
        if (exam.endDate && now > exam.endDate) {
          throw new BadRequestError('Exam has ended')
        }
      }

      // Check if attempt already exists
      const existingAttempt = await this.attemptRepository.findByExamAndUser(
        exam._id.toString(),
        userId
      )

      if (existingAttempt) {
        // Check if attempt is abandoned
        if (existingAttempt.status === 'abandoned') {
          throw new BadRequestError(
            'You cannot resume this exam. The exam session has been abandoned.'
          )
        }

        // Return existing attempt if still active
        if (existingAttempt.status === 'in-progress') {
          const questions = await this.questionRepository.findByExamId(
            exam._id.toString()
          )

          return {
            attemptId: existingAttempt._id.toString(),
            examId: this.getExamIdString(existingAttempt),
            title: exam.title,
            description: exam.description,
            duration: exam.duration,
            totalQuestions: questions.length,
            startedAt: existingAttempt.startedAt!.toISOString(),
            timeRemaining: existingAttempt.timeRemaining,
          }
        }

        if (existingAttempt.status === 'submitted') {
          throw new BadRequestError('You have already completed this exam')
        }
      }

      // Get questions
      const questions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )

      if (questions.length === 0) {
        throw new BadRequestError('Exam has no questions')
      }

      // Create question order (randomize if needed)
      let questionOrder = questions.map((_q: unknown, index: number) => index)
      if (exam.randomizeQuestions) {
        questionOrder = this.shuffleArray([...questionOrder])
      }

      // Create attempt
      const attempt = await this.attemptRepository.create({
        examId: exam._id.toString(),
        participantId: participant._id.toString(),
        userId: userId,
        questionOrder,
      })

      // Mark access code as used
      await this.participantRepository.markAsUsed(participant._id.toString())

      // Start attempt
      const startedAt = new Date()
      const durationSeconds = exam.duration * 60
      const updatedAttempt = await this.attemptRepository.updateById(
        attempt._id.toString(),
        {
          status: 'in-progress',
          startedAt,
          timeRemaining: durationSeconds,
          lastActivityAt: startedAt,
        }
      )

      if (!updatedAttempt) {
        throw new InternalServerError('Failed to start exam attempt')
      }

      logger.info('Exam started successfully', {
        attemptId: updatedAttempt._id.toString(),
        examId: exam._id.toString(),
      })

      return {
        attemptId: updatedAttempt._id.toString(),
        examId: this.getExamIdString(updatedAttempt),
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalQuestions: questions.length,
        startedAt: startedAt.toISOString(),
        timeRemaining: durationSeconds,
      }
    } catch (error) {
      logger.error('Error starting exam', error)
      throw error
    }
  }

  /**
   * Get next question (sequential)
   */
  async getNextQuestion(
    data: GetNextQuestionInput,
    userId: string
  ): Promise<GetNextQuestionOutput> {
    try {
      logger.debug('Getting next question', {
        attemptId: data.attemptId,
        userId,
      })

      const attempt = await this.attemptRepository.findById(data.attemptId)

      if (!attempt) {
        throw new NotFoundError('Exam attempt not found')
      }

      // Verify user owns this attempt
      if (attempt.userId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to access this attempt'
        )
      }

      // Check if attempt is active
      if (attempt.status !== 'in-progress') {
        throw new BadRequestError(
          `Cannot fetch questions. Exam attempt status: ${attempt.status}`
        )
      }

      // Validate time remaining
      const timeRemaining = await this.calculateTimeRemaining(attempt)
      if (timeRemaining <= 0) {
        // Auto-submit
        await this.autoSubmitExam(attempt._id.toString())
        throw new BadRequestError(
          'Exam time has expired. Your exam has been automatically submitted.'
        )
      }

      // Update activity
      await this.attemptRepository.updateActivity(attempt._id.toString())

      // Get exam
      const exam = await this.examRepository.findById(
        this.getExamIdString(attempt)
      )
      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Get questions
      const questions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )

      // Determine which question to return
      let questionIndex: number

      if (attempt.answeredQuestions.length === 0) {
        // First question
        questionIndex = attempt.questionOrder[0]
      } else {
        // Get last answered index
        const lastAnsweredIndex = Math.max(...attempt.answeredQuestions)
        const nextIndex = lastAnsweredIndex + 1

        // Check if all questions answered
        if (nextIndex >= attempt.questionOrder.length) {
          throw new BadRequestError('All questions have been answered')
        }

        // Check if previous question is answered
        const currentQuestionIndex = attempt.currentQuestionIndex
        if (currentQuestionIndex !== lastAnsweredIndex) {
          throw new BadRequestError(
            `Please answer question ${currentQuestionIndex + 1} before proceeding`
          )
        }

        questionIndex = attempt.questionOrder[nextIndex]
        attempt.currentQuestionIndex = nextIndex
        await attempt.save()
      }

      const question = questions[questionIndex]
      if (!question) {
        throw new NotFoundError('Question not found')
      }

      // Render question (exclude correct answer)
      const questionHandler = QuestionFactory.create(question.type)
      const renderedQuestion = questionHandler.render(question)

      // Calculate progress
      const total = questions.length
      const answered = attempt.answeredQuestions.length
      const current = attempt.currentQuestionIndex + 1
      const remaining = total - answered

      return {
        question: renderedQuestion,
        progress: {
          answered,
          total,
          currentIndex: current - 1,
          percentage: Math.round((answered / total) * 100),
          remaining,
        },
        timeRemaining,
      }
    } catch (error) {
      logger.error('Error getting next question', error)
      throw error
    }
  }

  /**
   * Submit answer
   */
  async submitAnswer(
    data: SubmitAnswerInput,
    userId: string
  ): Promise<SubmitAnswerOutput> {
    try {
      logger.debug('Submitting answer', {
        attemptId: data.attemptId,
        questionId: data.questionId,
        userId,
      })

      const attempt = await this.attemptRepository.findById(data.attemptId)

      if (!attempt) {
        throw new NotFoundError('Exam attempt not found')
      }

      // Verify user owns this attempt
      if (attempt.userId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to submit answers for this attempt'
        )
      }

      // Check if attempt is active
      if (attempt.status !== 'in-progress') {
        throw new BadRequestError(
          `Cannot submit answers. Exam attempt status: ${attempt.status}`
        )
      }

      // Validate time remaining
      const initialTimeRemaining = await this.calculateTimeRemaining(attempt)
      if (initialTimeRemaining <= 0) {
        await this.autoSubmitExam(attempt._id.toString())
        throw new BadRequestError(
          'Exam time has expired. Your exam has been automatically submitted.'
        )
      }

      // Get question
      const question = await this.questionRepository.findById(data.questionId)

      if (!question) {
        throw new NotFoundError('Question not found')
      }

      // Verify question belongs to exam
      if (question.examId.toString() !== this.getExamIdString(attempt)) {
        throw new BadRequestError('Question does not belong to this exam')
      }

      // Validate answer format
      const questionHandler = QuestionFactory.create(question.type)
      if (!questionHandler.validateAnswerFormat(data.answer)) {
        throw new BadRequestError(
          'Invalid answer format for this question type'
        )
      }

      // Update answer
      await this.attemptRepository.updateAnswer(
        attempt._id.toString(),
        question._id.toString(),
        data.answer
      )

      // Update activity
      await this.attemptRepository.updateActivity(attempt._id.toString())

      // Get updated attempt
      const updatedAttempt = await this.attemptRepository.findById(
        attempt._id.toString()
      )

      if (!updatedAttempt) {
        throw new InternalServerError('Failed to retrieve updated attempt')
      }

      // Get total questions
      const questions = await this.questionRepository.findByExamId(
        this.getExamIdString(attempt)
      )

      logger.debug('Answer submitted successfully', {
        attemptId: attempt._id.toString(),
        questionId: question._id.toString(),
      })

      // Calculate time remaining after update
      const finalTimeRemaining =
        await this.calculateTimeRemaining(updatedAttempt)

      return {
        message: 'Answer saved successfully',
        timeRemaining: finalTimeRemaining,
        progress: {
          answered: updatedAttempt.answeredQuestions.length,
          total: questions.length,
        },
      }
    } catch (error) {
      logger.error('Error submitting answer', error)
      throw error
    }
  }

  /**
   * Submit exam
   */
  async submitExam(
    data: SubmitExamInput,
    userId: string
  ): Promise<SubmitExamOutput> {
    try {
      logger.info('Submitting exam', {
        attemptId: data.attemptId,
        userId,
      })

      const attempt = await this.attemptRepository.findById(data.attemptId)

      if (!attempt) {
        throw new NotFoundError('Exam attempt not found')
      }

      // Verify user owns this attempt
      if (attempt.userId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to submit this exam'
        )
      }

      // Check if already submitted
      if (attempt.status === 'submitted') {
        throw new BadRequestError('Exam has already been submitted')
      }

      if (attempt.status !== 'in-progress') {
        throw new BadRequestError(
          `Cannot submit exam. Status: ${attempt.status}`
        )
      }

      // Get exam and questions
      const exam = await this.examRepository.findById(
        this.getExamIdString(attempt)
      )
      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      const questions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )

      // Validate all questions are answered
      if (attempt.answeredQuestions.length !== questions.length) {
        throw new BadRequestError(
          'Please answer all questions before submitting the exam'
        )
      }

      // Validate time remaining
      const timeRemaining = await this.calculateTimeRemaining(attempt)
      if (timeRemaining < 0) {
        throw new BadRequestError('Exam time has expired')
      }

      // Mark exam
      const markingResult = await this.markExam(attempt, questions)

      // Update attempt
      const submittedAt = new Date()
      const updatedAttempt = await this.attemptRepository.updateById(
        attempt._id.toString(),
        {
          status: 'submitted',
          submittedAt,
          score: markingResult.score,
          maxScore: markingResult.maxScore,
          percentage: markingResult.percentage,
          timeRemaining,
        }
      )

      if (!updatedAttempt) {
        throw new InternalServerError('Failed to submit exam')
      }

      logger.info('Exam submitted successfully', {
        attemptId: updatedAttempt._id.toString(),
        score: markingResult.score,
        maxScore: markingResult.maxScore,
      })

      return {
        attemptId: updatedAttempt._id.toString(),
        score: markingResult.score,
        maxScore: markingResult.maxScore,
        percentage: markingResult.percentage,
        submittedAt: submittedAt.toISOString(),
      }
    } catch (error) {
      logger.error('Error submitting exam', error)
      throw error
    }
  }

  /**
   * Get attempt results
   */
  async getAttemptResults(
    data: GetAttemptResultsInput,
    userId: string
  ): Promise<GetAttemptResultsOutput> {
    try {
      logger.debug('Getting attempt results', {
        attemptId: data.attemptId,
        userId,
      })

      const attempt = await this.attemptRepository.findById(data.attemptId)

      if (!attempt) {
        throw new NotFoundError('Exam attempt not found')
      }

      // Verify user owns this attempt
      if (attempt.userId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to view these results'
        )
      }

      // Check if exam is submitted
      if (attempt.status !== 'submitted') {
        throw new BadRequestError('Exam has not been submitted yet')
      }

      // Get exam
      const exam = await this.examRepository.findById(
        this.getExamIdString(attempt)
      )
      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Get questions
      const questions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )

      // Build results with answer details
      const answerDetails = await Promise.all(
        questions.map(async (question: IQuestion) => {
          const userAnswer = attempt.answers.get(question._id.toString())
          const questionHandler = QuestionFactory.create(question.type)

          // Mark the answer with options to handle index-based answers
          const earnedPoints = userAnswer
            ? questionHandler.markAnswer(
                userAnswer.answer,
                question.correctAnswer,
                question.points,
                question.options // Pass options for index-based answer conversion
              )
            : 0

          // Convert user answer from index to text if needed (for display)
          let displayUserAnswer: string | string[]
          if (userAnswer?.answer) {
            const answerStr = String(userAnswer.answer).trim()
            const answerIndex = parseInt(answerStr, 10)
            const isIndexAnswer =
              !isNaN(answerIndex) &&
              answerIndex.toString() === answerStr &&
              /^\d+$/.test(answerStr)

            if (
              isIndexAnswer &&
              question.options &&
              question.options.length > 0
            ) {
              // Convert index to option text
              if (answerIndex >= 0 && answerIndex < question.options.length) {
                displayUserAnswer = question.options[answerIndex]
              } else {
                displayUserAnswer = answerStr // Fallback to index if out of range
              }
            } else {
              // Already text, use as-is
              displayUserAnswer = answerStr
            }
          } else {
            displayUserAnswer = 'Not answered'
          }

          // Normalize correctAnswer to match interface (string | string[])
          let normalizedCorrectAnswer: string | string[]
          if (
            typeof question.correctAnswer === 'string' ||
            Array.isArray(question.correctAnswer)
          ) {
            normalizedCorrectAnswer = question.correctAnswer
          } else {
            normalizedCorrectAnswer = JSON.stringify(question.correctAnswer)
          }

          return {
            questionId: question._id.toString(),
            question:
              typeof question.question === 'string'
                ? question.question
                : JSON.stringify(question.question),
            userAnswer: displayUserAnswer, // Use converted text instead of index
            correctAnswer: normalizedCorrectAnswer,
            isCorrect: earnedPoints === question.points,
            points: question.points,
            earnedPoints,
          }
        })
      )

      const percentage = attempt.percentage || 0
      const passed = percentage >= exam.passPercentage

      return {
        attemptId: attempt._id.toString(),
        examId: exam._id.toString(),
        score: attempt.score || 0,
        maxScore: attempt.maxScore || 0,
        percentage,
        passed,
        passPercentage: exam.passPercentage,
        submittedAt: attempt.submittedAt!.toISOString(),
        answers: answerDetails,
      }
    } catch (error) {
      logger.error('Error getting attempt results', error)
      throw error
    }
  }

  /**
   * Get my results (for participant)
   */
  async getMyResults(
    data: GetMyResultsInput,
    userId: string
  ): Promise<GetMyResultsOutput> {
    try {
      logger.debug('Getting my results', { userId })

      // Use pagination from input
      const { pagination: paginationParams } = data

      const attempts = await this.attemptRepository.findByUserId(userId)

      logger.debug('Found attempts for user', {
        userId,
        totalAttempts: attempts.length,
        attemptsStatuses: attempts.map((a: IExamAttempt) => ({
          attemptId: a._id.toString(),
          status: a.status,
          submittedAt: a.submittedAt,
        })),
      })

      // Filter only submitted attempts
      const submittedAttempts = attempts.filter(
        (attempt: IExamAttempt) => attempt.status === 'submitted'
      )

      logger.debug('Filtered submitted attempts', {
        userId,
        totalAttempts: attempts.length,
        submittedCount: submittedAttempts.length,
      })

      // Get exam details for each attempt
      const results = await Promise.all(
        submittedAttempts.map(async (attempt: IExamAttempt) => {
          const exam = await this.examRepository.findById(
            this.getExamIdString(attempt)
          )

          const percentage = attempt.percentage || 0
          const passPercentage = exam?.passPercentage || 0
          const passed = percentage >= passPercentage

          return {
            attemptId: attempt._id.toString(),
            examId: attempt.examId.toString(),
            examTitle: exam?.title || 'Unknown Exam',
            score: attempt.score || 0,
            maxScore: attempt.maxScore || 0,
            percentage,
            passed,
            passPercentage,
            submittedAt: attempt.submittedAt!.toISOString(),
            status: attempt.status,
          }
        })
      )

      // Paginate the results
      const paginatedResult = paginateArray(results, paginationParams)

      return {
        data: paginatedResult.data,
        pagination: paginatedResult.pagination,
      }
    } catch (error) {
      logger.error('Error getting my results', error)
      throw error
    }
  }

  /**
   * Helper: Calculate time remaining
   */
  private async calculateTimeRemaining(attempt: IExamAttempt): Promise<number> {
    if (!attempt.startedAt) {
      return 0
    }

    const exam = await this.examRepository.findById(attempt.examId.toString())
    if (!exam || !exam.duration) {
      return 0
    }

    const startedAt = new Date(attempt.startedAt)
    const now = new Date()
    const elapsed = (now.getTime() - startedAt.getTime()) / 1000 // seconds
    const duration = exam.duration * 60 // convert minutes to seconds
    const remaining = duration - elapsed

    return Math.max(0, Math.floor(remaining))
  }

  /**
   * Helper: Mark exam
   */
  private async markExam(
    attempt: IExamAttempt,
    questions: IQuestion[]
  ): Promise<{ score: number; maxScore: number; percentage: number }> {
    let score = 0
    let maxScore = 0

    for (const question of questions) {
      maxScore += question.points

      const userAnswer = attempt.answers.get(question._id.toString())
      if (userAnswer) {
        const questionHandler = QuestionFactory.create(question.type)

        logger.debug('Marking question', {
          questionId: question._id.toString(),
          userAnswer: userAnswer.answer,
          correctAnswer: question.correctAnswer,
          options: question.options,
          points: question.points,
        })

        const earnedPoints = questionHandler.markAnswer(
          userAnswer.answer,
          question.correctAnswer,
          question.points,
          question.options // Pass options for index-based answer conversion
        )

        logger.debug('Question marked', {
          questionId: question._id.toString(),
          earnedPoints,
          maxPoints: question.points,
        })

        score += earnedPoints
      } else {
        logger.debug('No answer found for question', {
          questionId: question._id.toString(),
        })
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

    return { score, maxScore, percentage }
  }

  /**
   * Helper: Auto-submit exam when time expires
   */
  private async autoSubmitExam(attemptId: string): Promise<void> {
    try {
      const attempt = await this.attemptRepository.findById(attemptId)
      if (!attempt || attempt.status !== 'in-progress') {
        return
      }

      const exam = await this.examRepository.findById(
        this.getExamIdString(attempt)
      )
      if (!exam) {
        return
      }

      const questions = await this.questionRepository.findByExamId(
        exam._id.toString()
      )

      const markingResult = await this.markExam(attempt, questions)

      await this.attemptRepository.updateById(attemptId, {
        status: 'expired',
        submittedAt: new Date(),
        score: markingResult.score,
        maxScore: markingResult.maxScore,
        percentage: markingResult.percentage,
        timeRemaining: 0,
      })

      logger.info('Exam auto-submitted due to time expiration', { attemptId })
    } catch (error) {
      logger.error('Error auto-submitting exam', error)
    }
  }

  /**
   * Helper: Shuffle array for randomization
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
