# Quick Start Guide

This guide will help you get the Simple Assessment Platform up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Yarn** (v1.22 or higher) - [Download](https://yarnpkg.com/)
- **MongoDB** - Either:
  - MongoDB Community Edition running locally, or
  - A MongoDB Atlas account (free tier available)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/maceteligolden/simple-assessment.git
cd simple-assessment
```

### 2. Install Dependencies

#### Frontend Dependencies

```bash
cd frontend
yarn install
```

#### Backend Dependencies

```bash
cd ../backend
yarn install
```

### 3. Configure Environment Variables

#### Backend Configuration

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
   MONGODB_URI=mongodb://localhost:27017/simple-assessment
   JWT_SECRET=your-secret-key-change-in-production
   JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

   **Important Notes:**
   - Replace `MONGODB_URI` with your MongoDB connection string
   - For MongoDB Atlas, use: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
   - Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to secure random strings in production
   - Environment variables are centralized in `src/shared/constants/env.ts` for type safety

#### Frontend Configuration

The frontend automatically connects to the backend API. If your backend runs on a different port or domain, update the API base URL in `frontend/constants/api.constants.ts`.

## Running the Application

### Development Mode

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```
   Or ensure your MongoDB Atlas connection string is correct in the `.env` file.

2. **Start the Backend Server**
   ```bash
   cd backend
   yarn dev
   ```
   The backend will run on `http://localhost:5008` (or the port specified in your `.env` file).

3. **Start the Frontend Development Server** (in a new terminal)
   ```bash
   cd frontend
   yarn dev
   ```
   The frontend will run on `http://localhost:3000`

4. **Open Your Browser**
   Navigate to `http://localhost:3000` to see the application

### Production Mode

1. **Build and Start the Backend**
   ```bash
   cd backend
   yarn build
   yarn start
   ```

2. **Build and Start the Frontend**
   ```bash
   cd frontend
   yarn build
   yarn start
   ```

## First Steps

1. **Create an Account**
   - Navigate to the signup page
   - Fill in your details (first name, last name, email, password)
   - Choose your role (examiner or participant)

2. **For Examiners:**
   - Create your first exam
   - Add questions to the exam
   - Add participants by email
   - Share access codes with participants

3. **For Participants:**
   - Use the access code provided by your examiner
   - Start taking the exam
   - Submit your answers
   - View your results

## Troubleshooting

### Backend Issues

- **Port Already in Use**: Change the `PORT` in your `.env` file
- **MongoDB Connection Error**: Verify your `MONGODB_URI` is correct and MongoDB is running
- **JWT Errors**: Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set

### Frontend Issues

- **API Connection Error**: Verify the backend is running and the API base URL is correct
- **Build Errors**: Clear `node_modules` and reinstall: `rm -rf node_modules && yarn install`

## Next Steps

- Read the [Features Documentation](./features.md) to understand all available features
- Check the [Database Design](./database-design.md) to understand the data structure
- Explore the API endpoints in the backend Swagger documentation (available at `http://localhost:5008/api-docs` when the backend is running)
- Review the API endpoints section in the [Features Documentation](./features.md) for a complete list of available endpoints

## Getting Help

If you encounter any issues:
1. Check the logs in `backend/logs/` for backend errors
2. Check the browser console for frontend errors
3. Review the error messages for specific guidance
4. Ensure all prerequisites are installed and configured correctly

