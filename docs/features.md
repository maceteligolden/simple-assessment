# Features Documentation

This document provides a comprehensive overview of all features available in the Simple Assessment Platform.

## Core Features

### User Authentication

- **User Registration**: Create new accounts with email and password
- **User Login**: Secure authentication with JWT tokens
- **Session Management**: Automatic session refresh and token management
- **Role-Based Access**: Support for two user roles:
  - **Examiner**: Can create exams, add questions, and manage participants
  - **Participant**: Can take exams and view results
- **Secure Password Storage**: Passwords are hashed using bcrypt
- **Multi-Device Sessions**: Users can be logged in on multiple devices simultaneously

### Exam Creation

- **Exam Configuration**:
  - Set exam title and description
  - Configure duration (in minutes)
  - Set availability window (start and end dates) or make it available anytime
  - Enable/disable question randomization
  - Choose whether to show results immediately after submission

- **Question Management**:
  - Add multiple questions to an exam
  - Support for question types:
    - **Multiple Choice**: Questions with multiple options and one or more correct answers
    - Extensible architecture for future question types
  - Set points for each question (default: 1 point)
  - Automatic ordering system
  - Edit or delete questions (when no active attempts exist)
  - Question validation based on type

- **Participant Management**:
  - Add participants by email address
  - Generate unique access codes for each participant
  - Remove participants (if they haven't started the exam)
  - View participant list with attempt status

### Exam Delivery

- **Access Control**:
  - Participants use unique access codes to access exams
  - Access codes can only be used once
  - Participants can only access exams assigned to them

- **Exam Taking Experience**:
  - Sequential question navigation
  - Timer functionality with countdown display
  - Auto-submit when time expires
  - Save answers as you progress
  - Progress indicator showing answered/total questions
  - Question randomization (if enabled by examiner)

- **Answer Management**:
  - Submit answers one at a time
  - Review and change answers before final submission
  - Automatic answer validation based on question type

### Auto-Grading System

- **Automatic Scoring**:
  - Instant grading for multiple-choice questions
  - Score calculation based on question points
  - Percentage calculation
  - Maximum score tracking

- **Results Display**:
  - Immediate results (if enabled by examiner)
  - Detailed answer breakdown
  - Correct/incorrect answer indicators
  - Points earned per question

### Results Dashboard

- **For Examiners**:
  - View all participants for an exam
  - See participant attempt status (not started, in-progress, completed, abandoned)
  - View individual participant results with detailed answer breakdown
  - See scores, percentages, and submission times
  - Export exam results (future feature)

- **For Participants**:
  - View all exams assigned to them
  - See exam status (not started, in-progress, completed)
  - View results for completed exams
  - Track exam history with scores and dates
  - Filter exams by status or availability

### Exam Management

- **Exam Lifecycle**:
  - Create new exams
  - Edit exam details (when no active attempts exist)
  - Soft delete exams (marks as deleted, preserves data)
  - Activate/deactivate exams

- **Search and Filter**:
  - Search exams by title or description
  - Filter by active status
  - Pagination support for large lists

## Technical Features

### Frontend

- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Redux Toolkit**: State management for authentication and user data
- **shadcn/ui**: High-quality, accessible UI components
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Backend

- **Express.js**: Fast, unopinionated web framework
- **TypeScript**: Type-safe backend code
- **MongoDB with Mongoose**: NoSQL database with ODM
- **JWT Authentication**: Secure token-based authentication
- **Dependency Injection**: Using tsyringe for clean architecture
- **Winston Logging**: Comprehensive logging system
- **Swagger Documentation**: API documentation at `/api-docs`
- **Error Handling**: Centralized error handling with custom error classes

### Code Quality

- **ESLint**: Code linting for both frontend and backend
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Vitest**: Unit testing framework
- **Git Hooks**: Pre-commit hooks for code quality (future)

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Token refresh mechanism
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Mongoose ODM prevents injection attacks
- **XSS Protection**: Input sanitization and output encoding
- **CORS Configuration**: Controlled cross-origin resource sharing

## Performance Features

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient data loading for large datasets
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Automatic code splitting in Next.js
- **Caching**: Browser caching for static assets

## Future Features (Roadmap)

- [ ] Advanced question types (essay, true/false, matching)
- [ ] File upload support for questions and answers
- [ ] Advanced proctoring features
- [ ] Real-time notifications
- [ ] Exam analytics and reporting
- [ ] Bulk participant import
- [ ] Exam templates
- [ ] Question banks
- [ ] Export results to CSV/PDF
- [ ] Email notifications
- [ ] Multi-language support

## API Features

The backend provides a comprehensive RESTful API (all endpoints prefixed with `/api/v1`):

### Authentication Endpoints (`/api/v1/auth`)
- **POST `/signup`** - Register a new user (examiner or participant)
- **POST `/signin`** - Sign in user and receive JWT tokens
- **POST `/refresh`** - Refresh access token using refresh token
- **POST `/signout`** - Sign out and revoke current session
- **POST `/signout-all`** - Sign out from all devices
- **GET `/profile`** - Get current authenticated user profile
- **GET `/search`** - Search users by email (examiner only, for adding participants)

### Exam Management Endpoints (`/api/v1/exams`)
- **POST `/`** - Create a new exam (examiner only)
- **GET `/`** - List all exams created by user with pagination and search (examiner only)
- **GET `/:id`** - Get exam details including questions and participants (examiner only)
- **PUT `/:id`** - Update exam details (examiner only, if no active attempts)
- **DELETE `/:id`** - Soft delete exam (examiner only)
- **GET `/:id/results`** - Get all participant results for an exam (examiner only)
- **GET `/by-code`** - Get exam details by access code (participant)

### Question Management Endpoints (`/api/v1/exams/:id/questions`)
- **POST `/`** - Add a new question to an exam (examiner only)
- **PUT `/:questionId`** - Update a question (examiner only, if no active attempts)
- **DELETE `/:questionId`** - Delete a question (examiner only, if no active attempts)

### Participant Management Endpoints (`/api/v1/exams/:id/participants`)
- **POST `/`** - Add a participant to an exam by email (examiner only)
- **GET `/`** - List all participants for an exam with pagination and search (examiner only)
- **DELETE `/:participantId`** - Remove a participant from an exam (examiner only, if not started)
- **GET `/:participantId/result`** - Get detailed result for a specific participant (examiner only)
- **GET `/my-exams`** - Get all exams assigned to current participant with filters
- **GET `/my-exams/not-started`** - Get not-started exams for participant
- **GET `/me`** - Legacy endpoint for participant exams

### Exam Attempt Endpoints (`/api/v1/exams`)
- **POST `/start`** - Start an exam using access code (participant)
- **GET `/attempts/:attemptId/questions/next`** - Get next question in sequence (participant)
- **PUT `/attempts/:attemptId/answers`** - Submit answer for a question (participant)
- **POST `/attempts/:attemptId/submit`** - Submit completed exam (participant)
- **GET `/attempts/:attemptId/results`** - Get detailed results for an attempt (participant)
- **GET `/my-results`** - Get all exam results for current user with pagination (participant)

### Health Check
- **GET `/health`** - Server health check endpoint

### API Documentation
All API endpoints are fully documented with Swagger/OpenAPI specification and available at `/api-docs` when the backend is running. The documentation includes:
- Request/response schemas
- Authentication requirements
- Error responses
- Example requests and responses

