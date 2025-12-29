# Exam Attempt Engine

The Attempt module handles the logic of a participant actually taking an exam.

## 1. Core Workflow
1. **Start**: Validates access code, checks if the exam is currently available, and initializes the attempt.
2. **Question Flow**: Delivers questions one-by-one based on the `questionOrder` (randomized if enabled).
3. **Autosave**: Every answer selection triggers an immediate background save to prevent data loss.
4. **Submission**: Calculates final scores and marks the attempt as `SUBMITTED`.

## 2. Reliability Features
1. **Timer**: The backend tracks `startedAt` and enforces the `duration`.
2. **Autosubmit**: If a user tries to fetch a question after the time limit, the system automatically submits the exam.
3. **Transactions**: The `startExam` and `submitExam` flows are wrapped in MongoDB transactions to ensure the participant's status and attempt record are always in sync.

## 4. Deep Dive: Sub-Feature Mechanics

### 4.1 Access Code Validation Flow
The "one-time use" logic is strictly enforced during the `startExam` flow:
1.  **Lookup**: Find participant by `accessCode`.
2.  **Availability Check**: Verify the current time is within the exam's `startDate` and `endDate`.
3.  **Usage Check**: If `participant.isUsed` is true, deny entry.
4.  **Transaction**: If all checks pass, a transaction starts to create the attempt and set `isUsed = true`.

### 4.2 Handling Randomized Sequences
When randomization is enabled, the system generates the sequence during the `START` action:
- It uses a Fisher-Yates shuffle on the array of question indices.
- The resulting array is saved as `questionOrder` in the attempt.
- Subsequent calls to `getNextQuestion` simply reference the next index in this pre-shuffled array.

## 5. Decision Log
- **No Mid-Exam Changes**: Once an attempt starts, the question order and content are "locked" for that participant. This ensures that even if an examiner deletes a question while an exam is live, the current participants aren't affected by unexpected index shifts.

