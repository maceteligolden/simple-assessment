import { container } from 'tsyringe'
import { IUserRepository, UserRepository } from './repository/user.repository'
import {
  ISessionRepository,
  SessionRepository,
} from './repository/session.repository'
import { IExamRepository, ExamRepository } from './repository/exam.repository'
import {
  IQuestionRepository,
  QuestionRepository,
} from './repository/question.repository'
import {
  IExamParticipantRepository,
  ExamParticipantRepository,
} from './repository/exam-participant.repository'
import {
  IExamAttemptRepository,
  ExamAttemptRepository,
} from './repository/exam-attempt.repository'
import { ISessionService, SessionService } from './service/session.service'
import { AuthService } from '../modules/auth/auth.service'
import { IAuthService } from '../modules/auth/interfaces'
import {
  ExamService,
  QuestionService,
  ExamParticipantService,
  ExamAttemptService,
} from '../modules/exam/services'
import {
  IExamService,
  IQuestionService,
  IExamParticipantService,
  IExamAttemptService,
} from '../modules/exam/interfaces'
import { AuthController } from '../modules/auth/auth.controller'
import {
  ExamController,
  QuestionController,
  ExamParticipantController,
  ExamAttemptController,
} from '../modules/exam/controllers'

/**
 * Dependency Injection Container Setup
 * Registers all services, repositories, and controllers
 */
export function setupContainer(): void {
  // Register repositories
  container.register<IUserRepository>('IUserRepository', {
    useClass: UserRepository,
  })

  container.register<ISessionRepository>('ISessionRepository', {
    useClass: SessionRepository,
  })

  container.register<IExamRepository>('IExamRepository', {
    useClass: ExamRepository,
  })

  container.register<IQuestionRepository>('IQuestionRepository', {
    useClass: QuestionRepository,
  })

  container.register<IExamParticipantRepository>('IExamParticipantRepository', {
    useClass: ExamParticipantRepository,
  })

  container.register<IExamAttemptRepository>('IExamAttemptRepository', {
    useClass: ExamAttemptRepository,
  })

  // Register services
  container.register<ISessionService>('ISessionService', {
    useClass: SessionService,
  })

  container.register<IAuthService>('IAuthService', {
    useClass: AuthService,
  })

  container.register<IExamService>('IExamService', {
    useClass: ExamService,
  })

  container.register<IQuestionService>('IQuestionService', {
    useClass: QuestionService,
  })

  container.register<IExamParticipantService>('IExamParticipantService', {
    useClass: ExamParticipantService,
  })

  container.register<IExamAttemptService>('IExamAttemptService', {
    useClass: ExamAttemptService,
  })

  // Register controllers
  container.register<AuthController>('AuthController', {
    useClass: AuthController,
  })

  container.register<ExamController>('ExamController', {
    useClass: ExamController,
  })

  container.register<QuestionController>('QuestionController', {
    useClass: QuestionController,
  })

  container.register<ExamParticipantController>('ExamParticipantController', {
    useClass: ExamParticipantController,
  })

  container.register<ExamAttemptController>('ExamAttemptController', {
    useClass: ExamAttemptController,
  })
}

/**
 * Get container instance
 */
export function getContainer() {
  return container
}
