# Reliability & Data Integrity

This document explains how the system handles errors and maintains a consistent state.

## 1. Database Transactions
Used for multi-document updates that must succeed or fail together:
1. **`signUp`**: User creation + initial token setup.
2. **`startExam`**: Attempt initialization + marking participant as used.
3. **`submitExam`**: Scoring + status update + result recording.
4. **`addQuestion`/`deleteQuestion`**: Question collection + Exam reference update.

## 2. Optimistic Locking
- Models use a `version` field.
- Prevents "Lost Updates" where two users edit the same document at once.

## 3. Error Handling
- **BaseError**: Standardized error classes for 400, 401, 403, 404, etc.
- **Global Handler**: Middleware that catches all errors and returns a predictable JSON response structure.
- **Logging**: All errors are logged to `logs/error.log` with stack traces (in development).

