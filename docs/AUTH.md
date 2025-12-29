# Authentication & Authorization

This document details the authentication and authorization mechanisms used in the platform.

## 1. Authentication Strategy
The system uses **JWT (JSON Web Token)** for stateless authentication.
- **Access Tokens**: Short-lived (15 minutes) for API security.
- **Refresh Tokens**: Long-lived (7 days) stored in the database to allow seamless session renewal.
- **Hashing**: Passwords are hashed using `bcryptjs` with a cost factor of 12.

## 2. Authorization (RBAC)
Role-Based Access Control is enforced via middleware:
- **Examiner**: Full control over exams, questions, and participant results.
- **Participant**: Limited to viewing invited exams, taking attempts, and seeing personal results.

## 3. Decision Logs
- **Why JWT?**: To keep the backend scalable and reduce database round-trips for every request.
- **Why Refresh Tokens?**: To balance security (short access token life) with user experience (users stay logged in).
- **Session Tracking**: We added a `Session` model to track active logins, allowing users to revoke access from other devices.

## 4. Middleware Implementation
- `authenticate`: Verifies the Bearer token in the `Authorization` header.
- `requireExaminer` / `requireParticipant`: Enforces role restrictions at the route level.

