# Simple Assessment Platform

A minimal online exam and assessment platform built with Next.js and Express TypeScript. This project demonstrates a full-stack application for creating, delivering, and managing online exams.

## 🚀 Features

### Core Features
- **User Authentication**: Sign up, login, and secure session management
- **Exam Creation**: Create exams with multiple question types (MCQ, short answer)
- **Exam Delivery**: Take exams with timer functionality
- **Basic Proctoring**: Browser focus detection and tab switching alerts
- **Auto-Grading**: Automatic grading for multiple-choice questions
- **Results Dashboard**: View exam results and analytics
- **Exam History**: Track taken exams and scores

### Technical Features
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Code Quality**: ESLint and Prettier configured
- **Package Manager**: Yarn

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
Feature-specific modules (to be implemented):
- Each module will contain its own routes, controllers, services, and models
- Examples: `auth`, `exams`, `users`, etc.

### Frontend Architecture

The frontend follows Next.js 14 App Router conventions with:
- **Component-based architecture** organized by feature modules
- **Custom hooks** for API calls and UI state management
- **Redux** for global state management
- **TypeScript** for type safety throughout

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

The backend API will provide the following endpoints (to be implemented):

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create a new exam
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams/:id/submit` - Submit exam answers
- `GET /api/results` - Get user's exam results
- `GET /health` - Health check endpoint

## 🚧 Development Roadmap

- [x] Project setup and configuration
- [ ] User authentication (register/login)
- [ ] Exam creation interface
- [ ] Exam taking interface with timer
- [ ] Basic proctoring (focus detection)
- [ ] Auto-grading system
- [ ] Results dashboard
- [ ] Exam analytics

## 📝 License

MIT

## 👤 Author

maceteligolden

## 🙏 Acknowledgments

Inspired by Synap's online exam platform (https://synap.ac/)

