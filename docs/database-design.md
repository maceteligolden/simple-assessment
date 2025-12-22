# Database Design

This document describes the database schema and data models used in the Simple Assessment Platform.

## Overview

The application uses **MongoDB** as the database with **Mongoose** as the Object Document Mapper (ODM). The database consists of 6 main collections that work together to support the exam platform functionality.

## Entity Relationship Diagram

```
User
  ├── creates ──> Exam
  ├── has ──> Session (multiple)
  ├── participates in ──> ExamParticipant
  └── attempts ──> ExamAttempt

Exam
  ├── has ──> Question (multiple)
  ├── has ──> ExamParticipant (multiple)
  └── has ──> ExamAttempt (multiple)

Question
  └── belongs to ──> Exam

ExamParticipant
  ├── belongs to ──> Exam
  ├── belongs to ──> User
  └── has ──> ExamAttempt (one)

ExamAttempt
  ├── belongs to ──> Exam
  ├── belongs to ──> ExamParticipant
  └── belongs to ──> User
```

## Collections

### 1. User Collection

Stores user account information and authentication data.

**Schema:**
```typescript
{
  firstName: string (required, 2-50 chars)
  lastName: string (required, 2-50 chars)
  email: string (required, unique, indexed, lowercase)
  password: string (required, min 8 chars, not selected by default)
  role: 'examiner' | 'participant' (required, enum)
  refreshToken?: string (optional)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `email` (unique)
- `role`

**Relationships:**
- One-to-Many with `Exam` (as creator)
- One-to-Many with `Session`
- One-to-Many with `ExamParticipant`
- One-to-Many with `ExamAttempt`

### 2. Exam Collection

Stores exam configuration and metadata.

**Schema:**
```typescript
{
  title: string (required, 3-200 chars)
  description?: string (optional, max 1000 chars)
  duration: number (required, 1-1440 minutes)
  creatorId: ObjectId (required, ref: 'User', indexed)
  availableAnytime: boolean (default: false)
  startDate?: Date (optional)
  endDate?: Date (optional)
  randomizeQuestions: boolean (default: false)
  showResultsImmediately: boolean (default: false)
  isActive: boolean (default: true, indexed)
  isDeleted: boolean (default: false, indexed)
  questions: ObjectId[] (ref: 'Question')
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `creatorId`
- `isActive`
- `isDeleted`
- Compound: `{ creatorId: 1, isDeleted: 1 }`

**Relationships:**
- Many-to-One with `User` (creator)
- One-to-Many with `Question`
- One-to-Many with `ExamParticipant`
- One-to-Many with `ExamAttempt`

**Soft Delete:**
- Exams are soft-deleted (marked as `isDeleted: true`) to preserve data integrity

### 3. Question Collection

Stores individual exam questions.

**Schema:**
```typescript
{
  examId: ObjectId (required, ref: 'Exam', indexed)
  type: 'multi-choice' (required, enum, currently only multi-choice supported)
  question: string | object (required, flexible for text/audio/etc)
  options?: string[] (required for multi-choice, min 2)
  correctAnswer: string | string[] | object (required, type-specific)
  points: number (default: 1, min: 0)
  order: number (required, min: 0)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `examId`
- Compound: `{ examId: 1, order: 1 }` (unique)

**Relationships:**
- Many-to-One with `Exam`

**Question Types:**
- Currently supports: `multi-choice` (multiple choice questions)
- Extensible architecture for future types (essay, true/false, matching, etc.)
- Question factory pattern used for type-specific validation and rendering

### 4. ExamParticipant Collection

Links users to exams they can take.

**Schema:**
```typescript
{
  examId: ObjectId (required, ref: 'Exam', indexed)
  userId: ObjectId (required, ref: 'User', indexed)
  email: string (required, lowercase, indexed)
  accessCode: string (required, unique, indexed, auto-generated)
  isUsed: boolean (default: false, indexed)
  addedAt: Date (default: now)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `examId`
- `userId`
- `email`
- `accessCode` (unique)
- `isUsed`
- Compound: `{ examId: 1, userId: 1 }` (unique)

**Relationships:**
- Many-to-One with `Exam`
- Many-to-One with `User`
- One-to-One with `ExamAttempt`

**Access Code:**
- Auto-generated 6-character alphanumeric code (e.g., "ABC123")
- Unique per participant
- Used once per exam attempt

### 5. ExamAttempt Collection

Tracks exam attempts and answers.

**Schema:**
```typescript
{
  examId: ObjectId (required, ref: 'Exam', indexed)
  participantId: ObjectId (required, ref: 'ExamParticipant', indexed)
  userId: ObjectId (required, ref: 'User', indexed)
  status: 'not-started' | 'in-progress' | 'abandoned' | 'submitted' | 'expired'
    (default: 'not-started', indexed)
  startedAt?: Date (optional)
  submittedAt?: Date (optional)
  abandonedAt?: Date (optional)
  lastActivityAt?: Date (optional, indexed)
  timeRemaining: number (seconds)
  currentQuestionIndex: number (default: 0)
  answeredQuestions: number[] (array of question indices)
  questionOrder: number[] (randomized order if exam.randomizeQuestions is true)
  answers: Map<string, {
    answer: string | string[]
    answeredAt: Date
    updatedAt: Date
  }>
  score?: number (optional)
  maxScore?: number (optional)
  percentage?: number (optional)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `examId`
- `participantId`
- `userId`
- `status`
- `lastActivityAt`

**Relationships:**
- Many-to-One with `Exam`
- Many-to-One with `ExamParticipant`
- Many-to-One with `User`

**Answer Storage:**
- Answers are stored in a Map structure
- Key: Question ID (string)
- Value: Answer object with answer data and timestamps

**Status Flow:**
1. `not-started` → Initial state
2. `in-progress` → When exam is started
3. `submitted` → When exam is completed
4. `abandoned` → When user abandons the exam
5. `expired` → When time runs out

### 6. Session Collection

Manages user authentication sessions.

**Schema:**
```typescript
{
  userId: ObjectId (required, ref: 'User', indexed)
  sessionToken: string (required, unique, indexed)
  refreshToken: string (required, indexed)
  ipAddress?: string (optional)
  userAgent?: string (optional)
  expiresAt: Date (required, indexed)
  lastActivity: Date (default: now, indexed)
  isActive: boolean (default: true, indexed)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `userId`
- `sessionToken` (unique)
- `refreshToken`
- `expiresAt`
- `lastActivity`
- `isActive`
- Compound: `{ userId: 1, isActive: 1 }`

**Relationships:**
- Many-to-One with `User`

**Session Management:**
- Supports multiple active sessions per user
- Automatic expiration based on `expiresAt`
- Activity tracking with `lastActivity`
- Can be revoked individually or all at once

## Data Integrity

### Constraints

1. **Unique Constraints:**
   - User email must be unique
   - Access codes must be unique
   - Session tokens must be unique
   - Question order per exam must be unique
   - One participant per exam-user combination

2. **Referential Integrity:**
   - All foreign key references use MongoDB ObjectIds
   - Cascade considerations handled in application logic
   - Soft deletes preserve referential integrity

3. **Validation:**
   - Email format validation
   - Password length requirements
   - Question type validation
   - Date range validation for exam availability

### Indexes

All collections have appropriate indexes for:
- Foreign key lookups
- Unique constraints
- Common query patterns
- Performance optimization

## Data Flow Examples

### Creating and Taking an Exam

1. **Examiner creates exam:**
   - `Exam` document created with `creatorId` reference
   - `Question` documents created with `examId` references

2. **Examiner adds participant:**
   - `ExamParticipant` document created with `examId` and `userId` references
   - Unique `accessCode` generated

3. **Participant starts exam:**
   - `ExamAttempt` document created with references to `examId`, `participantId`, and `userId`
   - `ExamParticipant.isUsed` set to `true`
   - `questionOrder` array created (randomized if needed)

4. **Participant submits answers:**
   - Answers stored in `ExamAttempt.answers` Map
   - `answeredQuestions` array updated

5. **Participant submits exam:**
   - `ExamAttempt.status` set to `submitted`
   - Scores calculated and stored
   - Results available for viewing

## Performance Considerations

1. **Indexing Strategy:**
   - All foreign keys are indexed
   - Frequently queried fields are indexed
   - Compound indexes for common query patterns

2. **Query Optimization:**
   - Use of `select: false` for sensitive fields (passwords)
   - Population used sparingly to avoid N+1 queries
   - Pagination for large result sets

3. **Data Modeling:**
   - Embedded vs. referenced based on access patterns
   - Map structure for answers provides efficient lookups
   - Soft deletes preserve data without cluttering active queries

## Migration Considerations

When making schema changes:

1. **Backward Compatibility:**
   - Add new fields as optional initially
   - Use default values for required new fields
   - Migrate existing documents in batches

2. **Index Management:**
   - Create indexes in background to avoid blocking
   - Monitor index usage and remove unused indexes

3. **Data Migration:**
   - Write migration scripts for data transformations
   - Test migrations on staging environment first
   - Maintain rollback procedures

