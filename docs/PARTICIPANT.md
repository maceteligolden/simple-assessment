# Participant Management

This document explains how participants are managed and invited.

## 1. Features
1. **Invitations**: Examiners add participants by email address.
2. **Access Codes**: Every participant invitation generates a unique, high-entropy hex code (e.g., `A1B2C3D4`).
3. **Status Tracking**: Tracks whether a participant has used their code and their current progress status.

## 2. Access Control & Distribution

### 2.1 One-Time Use Access Codes
The security of the exam delivery relies on the `isUsed` status of an access code.
- **Enforcement**: When a participant attempts to start an exam, the system checks the `ExamParticipant` record. If `isUsed` is true, the request is rejected with a `400 Bad Request`.
- **Atomicity**: The marking of a code as "used" happens inside a **MongoDB Transaction** simultaneously with the creation of the `ExamAttempt`. This prevents race conditions where a code could be used twice if two requests are sent at the exact same millisecond.

### 2.2 Manual Code Distribution (Simplicity Choice)
Currently, the system does not automatically email access codes to participants.
- **Process**: Once an examiner adds a participant, the system generates the code. The examiner is then responsible for copying and sending this code to the participant (via Slack, WhatsApp, or manual email).
- **Decision Rationale**: This was an intentional choice to keep the initial version of the platform **simple and low-cost**. Integrating a reliable email service provider (like SendGrid or AWS SES) adds complexity and monthly operational costs. In the current state, the platform remains highly portable and self-contained.

## 3. Technical Decisions
1. **Decoupled Logic**: Participants are stored in a separate `ExamParticipant` collection rather than embedded in the Exam model to support large-scale exams.
2. **Search**: Examiners can search for existing users by email to quickly add them as participants.

## 3. Optimizations
- **Batch Processing**: The `listParticipants` service was optimized to fetch all attempt data in a single batch query rather than per-participant, resolving the N+1 performance issue.
- **Indexing**: Database indexes on `{examId, userId}` ensure unique invitations and fast lookups.

