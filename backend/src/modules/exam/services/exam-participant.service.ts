import { injectable, inject } from 'tsyringe'
import {
  IExamRepository,
  IExamParticipantRepository,
  IExamAttemptRepository,
  IQuestionRepository,
  IUserRepository,
} from '../../../shared/repository'
import { IParticipantCacheService } from '../cache'
import { QuestionFactory } from '../factory/question.factory'
import {
  logger,
  paginateArray,
  createPaginationMetadata,
} from '../../../shared/util'
import {
  EXAM_ATTEMPT_STATUS,
  PARTICIPANT_ATTEMPT_STATUS,
  mapAttemptStatusToParticipantStatus,
  type ExamAttemptStatus,
} from '../../../shared/constants'
import {
  AddParticipantInput,
  AddParticipantOutput,
  RemoveParticipantInput,
  RemoveParticipantOutput,
  ListParticipantsInput,
  ListParticipantsOutput,
  GetParticipantResultInput,
  GetParticipantResultOutput,
  GetMyExamsInput,
  GetMyExamsOutput,
  IExamParticipantService,
} from '../interfaces/participant.interface'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../../shared/errors'
import { IExamParticipant, IQuestion } from '../../../shared/model'

/**
 * Exam Participant Service Implementation
 * Handles all business logic related to exam participants
 */
@injectable()
export class ExamParticipantService implements IExamParticipantService {
  constructor(
    @inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    @inject('IExamParticipantRepository')
    private readonly participantRepository: IExamParticipantRepository,
    @inject('IExamAttemptRepository')
    private readonly attemptRepository: IExamAttemptRepository,
    @inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @inject('IParticipantCacheService')
    private readonly participantCache: IParticipantCacheService
  ) {
    logger.debug('ExamParticipantService initialized')
  }

  /**
   * Add participant to exam
   */
  async addParticipant(
    data: AddParticipantInput,
    userId: string
  ): Promise<AddParticipantOutput> {
    try {
      logger.info('Adding participant to exam', {
        examId: data.examId,
        email: data.email,
        userId,
      })

      const exam = await this.examRepository.findById(data.examId)

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to add participants to this exam'
        )
      }

      // Check if exam has ended
      if (!exam.availableAnytime && exam.endDate) {
        const now = new Date()
        if (now > exam.endDate) {
          throw new BadRequestError(
            'Cannot add participants to an exam that has ended'
          )
        }
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(data.email)

      if (!user) {
        throw new NotFoundError('User with this email not found')
      }

      // Check if participant already exists
      const existingParticipant =
        await this.participantRepository.findByExamAndUser(
          exam._id.toString(),
          user._id.toString()
        )

      if (existingParticipant) {
        throw new ConflictError('Participant already added to this exam')
      }

      // Create participant
      const participant = await this.participantRepository.create({
        examId: exam._id.toString(),
        userId: user._id.toString(),
        email: user.email,
      })

      logger.info('Participant added successfully', {
        participantId: participant._id.toString(),
        accessCode: participant.accessCode,
      })

      // Invalidate caches
      await this.participantCache.invalidateParticipants(data.examId)
      await this.participantCache.invalidateMyExams(participant.userId.toString())
      await this.participantCache.invalidateNotStartedExams(participant.userId.toString())

      return {
        id: participant._id.toString(),
        email: participant.email,
        accessCode: participant.accessCode,
        addedAt: participant.addedAt.toISOString(),
      }
    } catch (error) {
      logger.error('Error adding participant', error)
      throw error
    }
  }

  /**
   * Remove participant from exam
   */
  async removeParticipant(
    data: RemoveParticipantInput,
    userId: string
  ): Promise<RemoveParticipantOutput> {
    try {
      logger.info('Removing participant from exam', {
        participantId: data.participantId,
        userId,
      })

      const participant = await this.participantRepository.findById(
        data.participantId
      )

      if (!participant) {
        throw new NotFoundError('Participant not found')
      }

      const exam = await this.examRepository.findById(
        participant.examId.toString()
      )

      if (!exam) {
        throw new NotFoundError('Exam not found')
      }

      // Check if user is the creator
      if (exam.creatorId.toString() !== userId) {
        throw new ForbiddenError(
          'You do not have permission to remove participants from this exam'
        )
      }

      // Check if participant has started exam
      const hasStarted = await this.participantRepository.hasStartedAttempt(
        participant._id.toString()
      )

      if (hasStarted) {
        throw new BadRequestError(
          'Cannot remove participant who has started the exam'
        )
      }

      // Delete participant
      await this.participantRepository.deleteById(participant._id.toString())

      logger.info('Participant removed successfully', {
        participantId: participant._id.toString(),
      })

      // Invalidate caches
      await this.participantCache.invalidateParticipants(participant.examId.toString())
      await this.participantCache.invalidateMyExams(participant.userId.toString())
      await this.participantCache.invalidateNotStartedExams(participant.userId.toString())

      return {
        message: 'Participant removed successfully',
      }
    } catch (error) {
      logger.error('Error removing participant', error)
      throw error
    }
  }

  /**
   * List all participants for an exam
   */
  async listParticipants(
    data: ListParticipantsInput,
    userId: string
  ): Promise<ListParticipantsOutput> {
    try {
      const { pagination: paginationParams, search: searchQuery } = data
      const search = searchQuery?.toLowerCase().trim()

      return this.participantCache.wrapParticipants(
        data.examId,
        paginationParams.page,
        paginationParams.limit,
        search,
        async () => {
          logger.debug('Fetching participants from DB (cache miss)', {
            examId: data.examId,
            userId,
          })

          const exam = await this.examRepository.findById(data.examId)

          if (!exam) {
            throw new NotFoundError('Exam not found')
          }

          // Check if user is the creator
          if (exam.creatorId.toString() !== userId) {
            throw new ForbiddenError(
              'You do not have permission to view participants for this exam'
            )
          }

          // Get all participants for the exam
          const participants = await this.participantRepository.findByExamId(
            exam._id.toString()
          )

          // Filter by search if provided
          let filteredParticipants = participants
          if (search) {
            filteredParticipants = participants.filter((p: { email: string }) =>
              p.email.toLowerCase().includes(search)
            )
          }

          // Paginate the filtered participants
          const paginatedResult = paginateArray(
            filteredParticipants,
            paginationParams
          )
          const paginatedParticipants = paginatedResult.data

          // Get attempt information for each participant
          const participantsWithAttempts = await Promise.all(
            paginatedParticipants.map(async (participant: IExamParticipant) => {
              const attempt = await this.attemptRepository.findByParticipant(
                participant._id.toString()
              )

              let attemptStatus: (typeof PARTICIPANT_ATTEMPT_STATUS)[keyof typeof PARTICIPANT_ATTEMPT_STATUS] =
                PARTICIPANT_ATTEMPT_STATUS.NOT_STARTED
              let score: number | undefined
              let maxScore: number | undefined
              let percentage: number | undefined
              let startedAt: string | undefined
              let submittedAt: string | undefined

              if (attempt) {
                // Map attempt.status to attemptStatus using the mapping function
                attemptStatus = mapAttemptStatusToParticipantStatus(
                  attempt.status as ExamAttemptStatus
                )
                if (attempt.status === EXAM_ATTEMPT_STATUS.SUBMITTED) {
                  score = attempt.score
                  maxScore = attempt.maxScore
                  percentage = attempt.percentage
                }

                if (attempt.startedAt) {
                  startedAt = attempt.startedAt.toISOString()
                }
                if (attempt.submittedAt) {
                  submittedAt = attempt.submittedAt.toISOString()
                }
              }

              return {
                id: participant._id.toString(),
                email: participant.email,
                accessCode: participant.accessCode,
                isUsed: participant.isUsed,
                addedAt: participant.addedAt.toISOString(),
                status: attemptStatus,
                score,
                maxScore,
                percentage,
                startedAt,
                submittedAt,
              }
            })
          )

          // Recalculate pagination metadata with the final data
          const finalPagination = createPaginationMetadata(
            filteredParticipants.length,
            paginationParams
          )

          return {
            data: participantsWithAttempts,
            pagination: finalPagination,
          }
        }
      )
    } catch (error) {
      logger.error('Error listing participants', error)
      throw error
    }
  }

  /**
   * Get participant result (detailed view)
   */
  async getParticipantResult(
    data: GetParticipantResultInput,
    userId: string
  ): Promise<GetParticipantResultOutput> {
    try {
      return this.participantCache.wrapParticipantResult(
        data.examId,
        data.participantId,
        async () => {
          logger.debug('Fetching participant result from DB (cache miss)', {
            examId: data.examId,
            participantId: data.participantId,
            userId,
          })

          const exam = await this.examRepository.findById(data.examId)

          if (!exam) {
            throw new NotFoundError('Exam not found')
          }

          // Check if user is the creator
          if (exam.creatorId.toString() !== userId) {
            throw new ForbiddenError(
              'You do not have permission to view participant results for this exam'
            )
          }

          const participant = await this.participantRepository.findById(
            data.participantId
          )

          if (!participant) {
            throw new NotFoundError('Participant not found')
          }

          // Verify participant belongs to exam
          if (participant.examId.toString() !== exam._id.toString()) {
            throw new BadRequestError(
              'Participant does not belong to this exam'
            )
          }

          // Get attempt if exists
          const attempt = await this.attemptRepository.findByParticipant(
            participant._id.toString()
          )

          const result: GetParticipantResultOutput = {
            participant: {
              id: participant._id.toString(),
              email: participant.email,
              accessCode: participant.accessCode,
              addedAt: participant.addedAt.toISOString(),
            },
          }

          if (attempt && attempt.status === EXAM_ATTEMPT_STATUS.SUBMITTED) {
            // Get questions for the exam with correct answers to build answer details
            const questions = await this.questionRepository.findByExamIdWithCorrectAnswers(
              exam._id.toString()
            )

            logger.debug('Fetched questions for participant results', {
              count: questions.length,
              attemptAnswersCount: attempt.answers.size,
            })

            // Build answer details using QuestionFactory
            const answers = await Promise.all(
              questions.map(async (question: IQuestion) => {
                const answerData = attempt.answers.get(question._id.toString())
                const questionHandler = QuestionFactory.create(question.type)

                logger.debug('Processing participant question result', {
                  questionId: question._id.toString(),
                  hasUserAnswer: !!answerData,
                  userAnswer: answerData?.answer,
                  correctAnswer: question.correctAnswer,
                })

                // Mark the answer with options to handle index-based answers
                const earnedPoints = answerData
                  ? questionHandler.markAnswer(
                      answerData.answer,
                      question.correctAnswer,
                      question.points,
                      question.options // Pass options for index-based answer conversion
                    )
                  : 0

                // Convert user answer from index to text if needed (for display)
                let displayUserAnswer: string | string[]
                if (answerData?.answer) {
                  const answerStr = String(answerData.answer).trim()
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
                    if (
                      answerIndex >= 0 &&
                      answerIndex < question.options.length
                    ) {
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

                const questionText =
                  typeof question.question === 'string'
                    ? question.question
                    : (question.question as { text?: string })?.text || ''

                // Normalize correctAnswer to match interface (string | string[]) and convert to text for display
                let normalizedCorrectAnswer: string | string[]
                const rawCorrectAnswer = question.correctAnswer
                if (
                  typeof rawCorrectAnswer === 'string' ||
                  Array.isArray(rawCorrectAnswer)
                ) {
                  const correctAnswers = Array.isArray(rawCorrectAnswer)
                    ? rawCorrectAnswer
                    : [rawCorrectAnswer]

                  const mappedCorrectAnswers = correctAnswers.map(ans => {
                    const answerStr = String(ans).trim()
                    const answerIndex = parseInt(answerStr, 10)
                    const isIndexAnswer =
                      !isNaN(answerIndex) &&
                      answerIndex.toString() === answerStr &&
                      /^\d+$/.test(answerStr)

                    if (
                      isIndexAnswer &&
                      question.options &&
                      question.options.length > 0 &&
                      answerIndex >= 0 &&
                      answerIndex < question.options.length
                    ) {
                      return question.options[answerIndex]
                    }
                    return answerStr
                  })

                  normalizedCorrectAnswer = Array.isArray(rawCorrectAnswer)
                    ? mappedCorrectAnswers
                    : mappedCorrectAnswers[0]
                } else {
                  normalizedCorrectAnswer = JSON.stringify(rawCorrectAnswer)
                }

                const resultDetail = {
                  questionId: question._id.toString(),
                  question: questionText,
                  userAnswer: displayUserAnswer, // Use converted text instead of index
                  correctAnswer: normalizedCorrectAnswer,
                  isCorrect: earnedPoints === question.points,
                  points: question.points,
                  earnedPoints,
                }

                logger.debug('Built participant question result detail', {
                  questionId: resultDetail.questionId,
                  isCorrect: resultDetail.isCorrect,
                  earnedPoints: resultDetail.earnedPoints,
                  userAnswer: resultDetail.userAnswer,
                  correctAnswer: resultDetail.correctAnswer,
                })

                return resultDetail
              })
            )

            result.attempt = {
              attemptId: attempt._id.toString(),
              status: attempt.status,
              score: attempt.score || 0,
              maxScore: attempt.maxScore || 0,
              percentage: attempt.percentage || 0,
              startedAt: attempt.startedAt?.toISOString() || '',
              submittedAt: attempt.submittedAt?.toISOString(),
              answers,
            }
          }

          return result
        }
      )
    } catch (error) {
      logger.error('Error getting participant result', error)
      throw error
    }
  }

  /**
   * Get all exams for a participant
   */
  async getMyExams(
    data: GetMyExamsInput,
    userId: string
  ): Promise<GetMyExamsOutput> {
    try {
      const {
        pagination: paginationParams,
        status: statusFilter,
        search,
        isAvailable: isAvailableFilter,
      } = data

      return this.participantCache.wrapMyExams(
        userId,
        paginationParams.page,
        paginationParams.limit,
        search,
        statusFilter,
        isAvailableFilter,
        async () => {
          logger.debug('Fetching my exams from DB (cache miss)', { userId })

          // Get all participants for this user
          const participants = await this.participantRepository.findByUserId(
            userId
          )

          // Get exam and attempt details for each participant
          const examsWithStatus = await Promise.all(
            participants.map(async (participant: IExamParticipant) => {
              // examId is an ObjectId (not populated), convert to string
              const examIdString = String(participant.examId)

              const exam = await this.examRepository.findById(examIdString)

              if (!exam) {
                return null
              }

              // Check if exam is available
              let isAvailable = true
              if (!exam.availableAnytime) {
                const now = new Date()
                if (exam.startDate && now < exam.startDate) {
                  isAvailable = false
                }
                if (exam.endDate && now > exam.endDate) {
                  isAvailable = false
                }
              }

              // Get attempt if exists
              const attempt = await this.attemptRepository.findByParticipant(
                participant._id.toString()
              )

              let attemptStatus: (typeof PARTICIPANT_ATTEMPT_STATUS)[keyof typeof PARTICIPANT_ATTEMPT_STATUS] =
                PARTICIPANT_ATTEMPT_STATUS.NOT_STARTED
              let attemptId: string | undefined
              let score: number | undefined
              let maxScore: number | undefined
              let percentage: number | undefined
              let startedAt: string | undefined
              let submittedAt: string | undefined

              if (attempt) {
                attemptId = attempt._id.toString()
                // Map attempt.status to attemptStatus using the mapping function
                attemptStatus = mapAttemptStatusToParticipantStatus(
                  attempt.status as ExamAttemptStatus
                )
                if (attempt.status === EXAM_ATTEMPT_STATUS.SUBMITTED) {
                  score = attempt.score
                  maxScore = attempt.maxScore
                  percentage = attempt.percentage
                }

                if (attempt.startedAt) {
                  startedAt = attempt.startedAt.toISOString()
                }
                if (attempt.submittedAt) {
                  submittedAt = attempt.submittedAt.toISOString()
                }
              }

              // Get question count
              const questions = await this.questionRepository.findByExamId(
                exam._id.toString()
              )

              return {
                examId: exam._id.toString(),
                participantId: participant._id.toString(),
                title: exam.title,
                description: exam.description,
                duration: exam.duration || 0,
                questionCount: questions.length,
                accessCode: participant.accessCode,
                addedAt: participant.addedAt.toISOString(),
                attemptStatus,
                attemptId,
                score,
                maxScore,
                percentage,
                startedAt,
                submittedAt,
                isAvailable,
              }
            })
          )

          // Filter out null values and apply filters
          let filteredExams = examsWithStatus.filter(
            (exam: (typeof examsWithStatus)[0]) => exam !== null
          ) as NonNullable<(typeof examsWithStatus)[0]>[]

          // Apply status filter
          if (statusFilter) {
            filteredExams = filteredExams.filter(
              exam => exam.attemptStatus === statusFilter
            )
          }

          // Apply availability filter
          if (isAvailableFilter !== undefined) {
            filteredExams = filteredExams.filter(
              exam => exam.isAvailable === isAvailableFilter
            )
          }

          // Apply search filter
          if (search && search.trim()) {
            const searchLower = search.trim().toLowerCase()
            filteredExams = filteredExams.filter(
              exam =>
                exam.title.toLowerCase().includes(searchLower) ||
                (exam.description &&
                  exam.description.toLowerCase().includes(searchLower))
            )
          }

          // Paginate the results
          const paginatedResult = paginateArray(filteredExams, paginationParams)

          return {
            data: paginatedResult.data,
            pagination: paginatedResult.pagination,
          }
        }
      )
    } catch (error) {
      logger.error('Error getting participant exams', error)
      throw error
    }
  }
}
