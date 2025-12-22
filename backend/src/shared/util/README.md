# Response Utility Usage Guide

This guide explains how to use the standardized response utility for consistent API responses.

## Overview

The `ResponseUtil` class provides a standardized way to send API responses with a consistent structure. All responses follow the `ApiResponse<T>` interface.

## Standard Response Structure

```typescript
{
  success: boolean
  data?: T
  error?: {
    message: string
    statusCode: number
    details?: unknown
  }
  meta?: {
    timestamp: string
    [key: string]: unknown
  }
}
```

## Usage Examples

### Success Responses

```typescript
import { ResponseUtil } from '@/shared/util'
import { Request, Response } from 'express'

// Simple success response
app.get('/example', (req: Request, res: Response) => {
  ResponseUtil.success(res, { message: 'Hello World' })
})

// Created response (201)
app.post('/example', (req: Request, res: Response) => {
  ResponseUtil.created(res, { id: '123', name: 'Example' })
})

// Success with custom status code
ResponseUtil.success(res, data, HTTP_STATUS.ACCEPTED)

// Success with metadata
ResponseUtil.success(res, data, HTTP_STATUS.OK, {
  requestId: 'req-123',
  version: '1.0'
})
```

### Error Responses

```typescript
// Bad Request (400)
ResponseUtil.badRequest(res, 'Invalid input data', { field: 'email' })

// Unauthorized (401)
ResponseUtil.unauthorized(res, 'Invalid credentials')

// Forbidden (403)
ResponseUtil.forbidden(res, 'Access denied')

// Not Found (404)
ResponseUtil.notFound(res, 'User not found')

// Conflict (409)
ResponseUtil.conflict(res, 'Email already exists', { email: 'user@example.com' })

// Unprocessable Entity (422)
ResponseUtil.unprocessableEntity(res, 'Validation failed', { errors: [...] })

// Generic error
ResponseUtil.error(res, 'Something went wrong', HTTP_STATUS.INTERNAL_SERVER_ERROR)
```

### Paginated Responses

```typescript
ResponseUtil.paginated(
  res,
  items,        // Array of items
  1,            // Current page
  10,           // Items per page
  100,          // Total items
  {             // Additional metadata
    sortBy: 'createdAt',
    order: 'desc'
  }
)
```

### Using ResponseOutput Interface

```typescript
import { ResponseOutput, ResponseUtil } from '@/shared/util'

function getExamData(): ResponseOutput<Exam> {
  return {
    data: exam,
    statusCode: HTTP_STATUS.OK,
    meta: {
      cached: true
    }
  }
}

// In route handler
app.get('/exam/:id', (req: Request, res: Response) => {
  const output = getExamData()
  ResponseUtil.send(res, output)
})
```

## Input/Output Interface Pattern

For business logic operations, use the Input/Output naming convention:

### Example: Participant Login

```typescript
// interfaces/auth.interface.ts
export interface ParticipantLoginInput extends ResponseInput {
  body: {
    email: string
    password: string
  }
}

export interface ParticipantLoginOutput extends ResponseOutput<{
  user: User
  token: string
}> {}

// In route handler
app.post('/auth/participant/login', 
  (req: Request<{}, {}, ParticipantLoginInput['body']>, res: Response) => {
    // Business logic
    const output: ParticipantLoginOutput = {
      data: {
        user: authenticatedUser,
        token: jwtToken
      }
    }
    ResponseUtil.send(res, output)
  }
)
```

### Example: Create Exam

```typescript
// interfaces/exam.interface.ts
export interface CreateExamInput extends ResponseInput {
  body: {
    title: string
    timeLimit: number
    questions: Question[]
  }
}

export interface CreateExamOutput extends ResponseOutput<{
  id: string
  title: string
  // ... other exam fields
}> {}

// In route handler
app.post('/exams',
  (req: Request<{}, {}, CreateExamInput['body']>, res: Response) => {
    const exam = createExamService(req.body)
    const output: CreateExamOutput = {
      data: exam,
      statusCode: HTTP_STATUS.CREATED
    }
    ResponseUtil.send(res, output)
  }
)
```

## Benefits

1. **Consistency**: All API responses follow the same structure
2. **Type Safety**: TypeScript interfaces ensure type safety
3. **Maintainability**: Easy to update response structure globally
4. **Developer Experience**: Clear, predictable API responses
5. **Error Handling**: Standardized error response format

