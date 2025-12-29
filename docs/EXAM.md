# Exam Management

This document covers the core Exam module features and business logic.

## 1. Features
1. **Creation**: Examiners can create exams with titles, descriptions, and durations.
2. **Scheduling**: Support for `availableAnytime` or specific `startDate` and `endDate` windows.
3. **Settings**: Configurable randomization of questions and immediate result display.
4. **Pass Percentage**: Mandatory requirement for exams to determine success/failure.

## 2. Business Rules
1. **Soft Delete**: Exams are never permanently deleted if they have history; they are marked `isDeleted: true`.
2. **Edit Restriction**: Examiners cannot modify the `passPercentage` once a participant has started the exam to maintain fairness and data integrity.
3. **Optimistic Locking**: Prevents concurrent edits from overwriting each other using the `version` field.

## 3. Advanced Configuration Logic

### 3.1 Question Randomization
The platform allows examiners to enable "Question Randomization" for any exam.
- **How it works**: When a participant starts an exam, the system fetches all available questions. If randomization is enabled, the backend shuffles the indices of these questions before creating the `ExamAttempt`.
- **Consistency**: The shuffled order is stored in the `questionOrder` field of the `ExamAttempt` document. This ensures that while every participant gets a different order, their specific sequence remains consistent if they refresh their page or reconnect.
- **Why?**: This is a simple but effective deterrent against cheating, as participants cannot easily share answers based on question numbers (e.g., "The answer to #5 is B").

## 4. Implementation Details
- **Projections**: The system uses different repository methods (`findByIdForExaminer` vs `findByIdForParticipant`) to ensure participants never see correct answers until authorized.
- **Caching**: Frequently accessed exam metadata is cached in the `ExamCacheService`.

