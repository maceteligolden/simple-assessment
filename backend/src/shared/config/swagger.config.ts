import swaggerJsdoc from 'swagger-jsdoc'
import { ENV } from '../constants'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simple Assessment API',
      version: '1.0.0',
      description:
        'API documentation for Simple Assessment - An online exam platform for creating and taking exams',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}`,
        description: 'Development server',
      },
      {
        url: `http://localhost:${ENV.PORT}/api/${ENV.API_VERSION}`,
        description: 'Development API base path',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
                details: {
                  type: 'string',
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
            },
          },
        },
        // Auth Schemas
        SignUpRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password', 'role'],
          properties: {
            firstName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              example: 'John',
            },
            lastName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              description:
                'Password must be at least 8 characters, contain uppercase, lowercase, and number',
              example: 'Password123',
            },
            role: {
              type: 'string',
              enum: ['examiner', 'participant'],
              example: 'examiner',
            },
          },
        },
        SignInRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              example: 'Password123',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439011',
                },
                firstName: {
                  type: 'string',
                  example: 'John',
                },
                lastName: {
                  type: 'string',
                  example: 'Doe',
                },
                email: {
                  type: 'string',
                  example: 'john.doe@example.com',
                },
                role: {
                  type: 'string',
                  enum: ['examiner', 'participant'],
                  example: 'examiner',
                },
              },
            },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              example: 'john.doe@example.com',
            },
            role: {
              type: 'string',
              enum: ['examiner', 'participant'],
              example: 'examiner',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Exam Schemas
        CreateExamRequest: {
          type: 'object',
          required: ['title', 'duration', 'availableAnytime'],
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              example: 'Mathematics Final Exam',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'Final examination for Mathematics course',
            },
            duration: {
              type: 'integer',
              minimum: 1,
              maximum: 1440,
              description: 'Duration in minutes',
              example: 60,
            },
            availableAnytime: {
              type: 'boolean',
              example: false,
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00Z',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-31T23:59:59Z',
            },
            randomizeQuestions: {
              type: 'boolean',
              default: false,
              example: false,
            },
            showResultsImmediately: {
              type: 'boolean',
              default: true,
              example: true,
            },
          },
        },
        UpdateExamRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              example: 'Mathematics Final Exam',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'Final examination for Mathematics course',
            },
            duration: {
              type: 'integer',
              minimum: 1,
              maximum: 1440,
              description: 'Duration in minutes',
              example: 60,
            },
            availableAnytime: {
              type: 'boolean',
              example: false,
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00Z',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-31T23:59:59Z',
            },
            randomizeQuestions: {
              type: 'boolean',
              example: false,
            },
            showResultsImmediately: {
              type: 'boolean',
              example: true,
            },
          },
        },
        Exam: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Mathematics Final Exam',
            },
            description: {
              type: 'string',
              example: 'Final examination for Mathematics course',
            },
            accessCode: {
              type: 'string',
              example: 'ABC123',
            },
            duration: {
              type: 'integer',
              example: 60,
            },
            availableAnytime: {
              type: 'boolean',
              example: false,
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            randomizeQuestions: {
              type: 'boolean',
              example: false,
            },
            showResultsImmediately: {
              type: 'boolean',
              example: true,
            },
            examinerId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Question Schemas
        AddQuestionRequest: {
          type: 'object',
          required: ['type', 'question', 'options', 'correctAnswer'],
          properties: {
            type: {
              type: 'string',
              enum: ['multi-choice'],
              example: 'multi-choice',
            },
            question: {
              oneOf: [
                {
                  type: 'string',
                  example: 'What is 2 + 2?',
                },
                {
                  type: 'object',
                },
              ],
            },
            options: {
              type: 'array',
              items: {
                type: 'string',
              },
              minItems: 2,
              example: ['2', '3', '4', '5'],
            },
            correctAnswer: {
              type: 'string',
              description:
                'Index of the correct option (0-based). For multi-choice, must be a valid option index.',
              example: '2',
            },
            points: {
              type: 'integer',
              minimum: 0,
              default: 1,
              example: 1,
            },
          },
        },
        UpdateQuestionRequest: {
          type: 'object',
          properties: {
            question: {
              oneOf: [
                {
                  type: 'string',
                  example: 'What is 2 + 2?',
                },
                {
                  type: 'object',
                },
              ],
            },
            options: {
              type: 'array',
              items: {
                type: 'string',
              },
              minItems: 2,
              example: ['2', '3', '4', '5'],
            },
            correctAnswer: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                {
                  type: 'object',
                },
              ],
            },
            points: {
              type: 'integer',
              minimum: 0,
              example: 1,
            },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            type: {
              type: 'string',
              enum: ['multi-choice'],
              example: 'multi-choice',
            },
            question: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'object',
                },
              ],
            },
            options: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            correctAnswer: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                {
                  type: 'object',
                },
              ],
            },
            points: {
              type: 'integer',
              example: 1,
            },
            examId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            order: {
              type: 'integer',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Participant Schemas
        AddParticipantRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'participant@example.com',
            },
          },
        },
        Participant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            examId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            status: {
              type: 'string',
              enum: ['pending', 'started', 'completed'],
              example: 'pending',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Attempt Schemas
        StartExamRequest: {
          type: 'object',
          required: ['accessCode'],
          properties: {
            accessCode: {
              type: 'string',
              example: 'ABC123',
            },
          },
        },
        SubmitAnswerRequest: {
          type: 'object',
          required: ['answer'],
          properties: {
            answer: {
              oneOf: [
                {
                  type: 'string',
                  example: '2',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['option1', 'option2'],
                },
              ],
            },
          },
        },
        Attempt: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            examId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            participantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['in-progress', 'submitted', 'graded'],
              example: 'in-progress',
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            score: {
              type: 'number',
              nullable: true,
              example: 85.5,
            },
            totalPoints: {
              type: 'integer',
              example: 100,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AttemptResult: {
          type: 'object',
          properties: {
            attempt: {
              $ref: '#/components/schemas/Attempt',
            },
            exam: {
              $ref: '#/components/schemas/Exam',
            },
            questions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Question',
              },
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            score: {
              type: 'number',
              example: 85.5,
            },
            totalPoints: {
              type: 'integer',
              example: 100,
            },
            percentage: {
              type: 'number',
              example: 85.5,
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 10,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 10,
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Exams',
        description: 'Exam management endpoints (Examiner only)',
      },
      {
        name: 'Questions',
        description: 'Question management endpoints (Examiner only)',
      },
      {
        name: 'Participants',
        description: 'Participant management endpoints',
      },
      {
        name: 'Attempts',
        description: 'Exam attempt and submission endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoint',
      },
    ],
  },
  apis: [
    './src/index.ts',
    './src/modules/auth/*.ts',
    './src/modules/exam/routes/*.ts',
  ],
}

export const swaggerSpec = swaggerJsdoc(options)

