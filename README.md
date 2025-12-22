# Simple Assessment Platform

A minimal online exam and assessment platform built with Next.js and Express TypeScript. This project demonstrates a full-stack application for creating, delivering, and managing online exams.

## 📚 Documentation

- **[Quick Start Guide](./docs/quick-start.md)** - Get up and running quickly
- **[Features Documentation](./docs/features.md)** - Comprehensive feature overview
- **[Database Design](./docs/database-design.md)** - Database schema and data models

## 🚀 Features

### Core Features
- **User Authentication**: Sign up, login, logout, and secure session management with JWT tokens
- **Role-Based Access**: Support for examiner and participant roles
- **Exam Creation**: Create exams with configurable settings (duration, availability, randomization)
- **Question Management**: Add, update, and delete questions (multiple choice supported)
- **Participant Management**: Add participants by email, generate unique access codes
- **Exam Delivery**: Take exams with timer functionality and sequential navigation
- **Auto-Grading**: Automatic grading for multiple-choice questions with score calculation
- **Results Dashboard**: View detailed exam results for examiners and participants
- **Exam History**: Track taken exams, scores, and attempt status
- **API Documentation**: Complete Swagger/OpenAPI documentation

### Technical Features
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Express.js with TypeScript, Dependency Injection (tsyringe)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with refresh tokens
- **API Documentation**: Swagger/OpenAPI with interactive documentation
- **Testing**: Vitest for unit testing
- **Code Quality**: ESLint and Prettier configured
- **Package Manager**: Yarn
- **Logging**: Winston-based logging system

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/) (v1.22 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or MongoDB Atlas account)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/maceteligolden/simple-assessment.git
   cd simple-assessment
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   yarn install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   yarn install
   ```

## ⚙️ Configuration

### Backend Configuration

1. Navigate to the `backend` directory
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your configuration:
   ```env
   PORT=5008
   NODE_ENV=development
   LOG_LEVEL=info
   # MONGODB_URI=mongodb://localhost:27017/simple-assessment
   # JWT_SECRET=your-secret-key-change-in-production
   ```
   
   **Note:** Environment variables are centralized in `src/shared/constants/env.ts` for type safety and easier management.

### Frontend Configuration

The frontend will connect to the backend API. Make sure to configure the API endpoint in your frontend environment variables if needed.

## 🏃 Running the Application

### Development Mode

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```
   Or ensure your MongoDB Atlas connection string is correct in the `.env` file.

2. **Start the backend server**
   ```bash
   cd backend
   yarn dev
   ```
   The backend will run on `http://localhost:5008` (default port, configurable via `PORT` env variable)

3. **Start the frontend development server** (in a new terminal)
   ```bash
   cd frontend
   yarn dev
   ```
   The frontend will run on `http://localhost:3000`

4. **Open your browser**
   Navigate to `http://localhost:3000` to see the application

### Production Mode

1. **Build the backend**
   ```bash
   cd backend
   yarn build
   yarn start
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   yarn build
   yarn start
   ```

## 📁 Project Structure

```
simple-assessment/
├── frontend/                        # Next.js frontend application
│   ├── app/                        # Next.js app directory
│   │   ├── layout.tsx             # Root layout with Redux provider
│   │   ├── page.tsx               # Home page
│   │   └── globals.css            # Global styles with Tailwind CSS
│   ├── components/                # React components organized by modules
│   │   ├── ui/                    # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── index.ts
│   │   ├── auth/                  # Authentication module components
│   │   ├── exam/                  # Exam module components
│   │   ├── dashboard/             # Dashboard module components
│   │   ├── layout/                # Layout components (Header, Footer, etc.)
│   │   └── index.ts               # Component exports
│   ├── hooks/                     # Custom React hooks
│   │   ├── api/                   # API-related hooks
│   │   │   ├── use-api.ts
│   │   │   └── index.ts
│   │   └── ui/                    # UI-related hooks
│   │       ├── use-toast.ts
│   │       ├── use-dialog.ts
│   │       └── index.ts
│   ├── store/                     # Redux store configuration
│   │   ├── store.ts
│   │   └── provider.tsx
│   ├── interfaces/                # TypeScript interfaces/types
│   │   ├── user.interface.ts
│   │   ├── exam.interface.ts
│   │   └── index.ts
│   ├── constants/                 # Application constants
│   │   ├── api.constants.ts
│   │   ├── app.constants.ts
│   │   └── index.ts
│   ├── lib/                       # Library utilities
│   │   └── utils.ts
│   ├── utils/                     # Application utilities
│   │   ├── format.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/                        # Express TypeScript backend
│   ├── src/                       # Source code
│   │   ├── index.ts              # Entry point
│   │   ├── modules/               # Feature modules
│   │   │   └── index.ts
│   │   └── shared/                # Shared resources
│   │       ├── constants/        # Shared constants
│   │       │   ├── env.ts        # Environment variables
│   │       │   ├── http-status-codes.ts
│   │       │   └── index.ts
│   │       ├── errors/           # Error abstractions
│   │       │   ├── base-error.ts
│   │       │   ├── bad-request-error.ts
│   │       │   ├── unauthorized-error.ts
│   │       │   ├── forbidden-error.ts
│   │       │   ├── not-found-error.ts
│   │       │   ├── conflict-error.ts
│   │       │   ├── unprocessable-entity-error.ts
│   │       │   ├── internal-server-error.ts
│   │       │   └── index.ts
│   │       ├── interfaces/       # Shared TypeScript interfaces
│   │       │   └── index.ts
│   │       ├── middleware/      # Express middleware
│   │       │   ├── error-handler.ts
│   │       │   ├── request-logger.ts
│   │       │   └── index.ts
│   │       ├── model/           # Shared model classes
│   │       │   └── index.ts
│   │       ├── repository/     # Shared repository classes
│   │       │   └── index.ts
│   │       ├── util/           # Shared utility functions
│   │       │   ├── logger.ts   # Winston logger service
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── logs/                    # Log files (generated)
│   ├── dist/                    # Compiled JavaScript (generated)
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
│
└── README.md                      # This file
```

## 🏗️ Architecture Overview

### Backend Architecture

The backend follows a modular architecture with a clear separation of concerns:

#### **Shared Folder** (`src/shared/`)
Contains reusable code used across the entire application:

- **`constants/`** - Centralized constants including:
  - `env.ts` - Environment variables with type safety
  - `http-status-codes.ts` - HTTP status code constants

- **`errors/`** - Custom error classes extending `BaseError`:
  - `BadRequestError` (400)
  - `UnauthorizedError` (401)
  - `ForbiddenError` (403)
  - `NotFoundError` (404)
  - `ConflictError` (409)
  - `UnprocessableEntityError` (422)
  - `InternalServerError` (500)

- **`middleware/`** - Express middleware:
  - `error-handler.ts` - Global error handling middleware
  - `request-logger.ts` - HTTP request logging middleware

- **`util/`** - Utility services:
  - `logger.ts` - Winston-based logging service with file and console transports

- **`interfaces/`** - Shared TypeScript interfaces
- **`model/`** - Shared model classes
- **`repository/`** - Shared repository classes

#### **Modules Folder** (`src/modules/`)
Feature-specific modules:
- **`auth/`** - Authentication module with signup, signin, token refresh, and user search
- **`exam/`** - Exam module with:
  - Exam CRUD operations
  - Question management
  - Participant management
  - Exam attempt handling
  - Results and analytics
- Each module contains its own routes, controllers, services, interfaces, and validation

### Frontend Architecture

The frontend follows Next.js 14 App Router conventions with:
- **Component-based architecture** organized by feature modules
- **Custom hooks** for API calls and UI state management
- **Redux** for global state management
- **TypeScript** for type safety throughout

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
yarn test                    # Run all tests
yarn test:watch             # Run tests in watch mode
yarn test test/shared/repository  # Run specific test suite
yarn test test/modules/exam/services  # Run service tests
```

### Test Coverage

The project includes comprehensive unit tests for:
- **Repositories**: All database operations (create, read, update, delete)
- **Services**: Business logic for exam, question, participant, and attempt services
- **Validation**: Input validation schemas

Tests are written using **Vitest** and follow best practices with proper mocking and isolation.

## 🧪 Code Quality

### Linting
```bash
# Frontend
cd frontend
yarn lint

# Backend
cd backend
yarn lint
yarn lint:fix  # Auto-fix linting issues
```

### Formatting
```bash
# Frontend
cd frontend
yarn format        # Format code
yarn format:check  # Check formatting

# Backend
cd backend
yarn format        # Format code
yarn format:check  # Check formatting
```

## 🎯 API Endpoints

The backend API provides the following endpoints (all prefixed with `/api/v1`):

### Authentication (`/api/v1/auth`)
- `POST /signup` - User registration
- `POST /signin` - User login
- `POST /refresh` - Refresh access token
- `POST /signout` - Sign out (revoke current session)
- `POST /signout-all` - Sign out from all devices
- `GET /profile` - Get current user profile
- `GET /search` - Search users by email (examiner only)

### Exams (`/api/v1/exams`)
- `POST /` - Create a new exam (examiner only)
- `GET /` - List all exams created by user (examiner only)
- `GET /:id` - Get exam details (examiner only)
- `PUT /:id` - Update exam (examiner only)
- `DELETE /:id` - Delete exam (examiner only)
- `GET /:id/results` - Get exam results (examiner only)
- `GET /by-code` - Get exam by access code (participant)

### Questions (`/api/v1/exams/:id/questions`)
- `POST /` - Add question to exam (examiner only)
- `PUT /:questionId` - Update question (examiner only)
- `DELETE /:questionId` - Delete question (examiner only)

### Participants (`/api/v1/exams/:id/participants`)
- `POST /` - Add participant to exam (examiner only)
- `GET /` - List all participants for an exam (examiner only)
- `DELETE /:participantId` - Remove participant from exam (examiner only)
- `GET /:participantId/result` - Get participant result details (examiner only)
- `GET /my-exams` - Get all exams for current participant
- `GET /my-exams/not-started` - Get not-started exams for participant
- `GET /me` - Get participant exams (legacy endpoint)

### Exam Attempts (`/api/v1/exams`)
- `POST /start` - Start exam by access code
- `GET /attempts/:attemptId/questions/next` - Get next question
- `PUT /attempts/:attemptId/answers` - Submit answer
- `POST /attempts/:attemptId/submit` - Submit exam
- `GET /attempts/:attemptId/results` - Get attempt results
- `GET /my-results` - Get user's exam results (with pagination)

### Health
- `GET /health` - Health check endpoint

**Note:** All API endpoints are documented with Swagger and available at `/api-docs` when the backend is running.

## 🚧 Development Roadmap

### Completed ✅
- [x] Project setup and configuration
- [x] User authentication (register/login/logout)
- [x] Session management with JWT tokens
- [x] Exam creation interface
- [x] Question management (add, update, delete)
- [x] Participant management
- [x] Exam taking interface with timer
- [x] Auto-grading system
- [x] Results dashboard for examiners and participants
- [x] API documentation with Swagger
- [x] Unit tests for repositories and services
- [x] Error handling and validation
- [x] Database design and implementation

### In Progress 🚧
- [ ] Advanced proctoring features
- [ ] Exam analytics and reporting

### Planned 📋
- [ ] Advanced question types (essay, true/false, matching)
- [ ] File upload support
- [ ] Real-time notifications
- [ ] Bulk participant import
- [ ] Exam templates
- [ ] Question banks
- [ ] Export results to CSV/PDF
- [ ] Email notifications
- [ ] Multi-language support

## 📝 License

MIT

## 👤 Author

maceteligolden

## 🙏 Acknowledgments

Inspired by Synap's online exam platform (https://synap.ac/)

