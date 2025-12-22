# Middleware Documentation

## Authentication Middleware

### `authenticate`
Verifies JWT token and attaches user information to the request.

**Usage:**
```typescript
import { authenticate } from '@/shared/middleware'

router.get('/protected', authenticate, controller.handler)
```

**What it does:**
- Extracts token from `Authorization` header
- Verifies the JWT token
- Attaches `req.user` with user information (userId, email, role)
- Returns 401 if token is missing or invalid

---

## Role-Based Authorization Middleware

### `requireRoles(allowedRoles: UserRole[])`
Checks if the authenticated user has one of the required roles.

**Important:** This middleware must be used AFTER `authenticate` middleware.

**Usage:**
```typescript
import { authenticate, requireRoles } from '@/shared/middleware'
import { USER_ROLES } from '@/shared/constants'

// Allow only examiners
router.post('/exams', 
  authenticate, 
  requireRoles([USER_ROLES.EXAMINER]), 
  controller.createExam
)

// Allow both examiners and participants
router.get('/profile', 
  authenticate, 
  requireRoles([USER_ROLES.EXAMINER, USER_ROLES.PARTICIPANT]), 
  controller.getProfile
)
```

**Parameters:**
- `allowedRoles`: Array of roles that are permitted to access the endpoint

**What it does:**
- Checks if `req.user` exists (user must be authenticated)
- Verifies that `req.user.role` is in the `allowedRoles` array
- Returns 401 if user is not authenticated
- Returns 403 if user doesn't have required role
- Calls `next()` if authorization succeeds

---

### Convenience Middleware

For common use cases, you can use these convenience functions:

#### `requireExaminer`
Allows only examiners to access the endpoint.

```typescript
import { authenticate, requireExaminer } from '@/shared/middleware'

router.post('/exams', authenticate, requireExaminer, controller.createExam)
```

#### `requireParticipant`
Allows only participants to access the endpoint.

```typescript
import { authenticate, requireParticipant } from '@/shared/middleware'

router.get('/my-results', authenticate, requireParticipant, controller.getMyResults)
```

#### `requireAnyRole`
Allows any authenticated user (both examiners and participants).

```typescript
import { authenticate, requireAnyRole } from '@/shared/middleware'

router.get('/profile', authenticate, requireAnyRole, controller.getProfile)
```

---

## Combining Middleware

You can chain multiple middleware functions:

```typescript
import { authenticate, requireRoles, validate } from '@/shared/middleware'
import { USER_ROLES } from '@/shared/constants'
import { createExamSchema } from './exam.validation'

router.post(
  '/exams',
  authenticate,                    // 1. Verify authentication
  requireRoles([USER_ROLES.EXAMINER]), // 2. Check role
  validate(createExamSchema),      // 3. Validate request body
  controller.createExam            // 4. Handle request
)
```

**Order matters:**
1. Authentication (`authenticate`) - Must be first
2. Authorization (`requireRoles`) - Must be after authentication
3. Validation (`validate`) - Can be anywhere after authentication
4. Route handler - Always last

---

## Error Responses

### Authentication Errors (401 Unauthorized)
- Token missing: "Authentication required. Please provide a valid token."
- Token invalid: Error message from token verification

### Authorization Errors (403 Forbidden)
- Insufficient permissions: "You do not have permission to access this resource"

---

## Examples

### Examiner-only endpoint
```typescript
router.post(
  '/exams',
  authenticate,
  requireRoles([USER_ROLES.EXAMINER]),
  controller.createExam
)
```

### Participant-only endpoint
```typescript
router.get(
  '/my-exams',
  authenticate,
  requireRoles([USER_ROLES.PARTICIPANT]),
  controller.getMyExams
)
```

### Both roles allowed
```typescript
router.get(
  '/profile',
  authenticate,
  requireRoles([USER_ROLES.EXAMINER, USER_ROLES.PARTICIPANT]),
  controller.getProfile
)
```

### Using convenience middleware
```typescript
// Examiner only
router.delete('/exams/:id', authenticate, requireExaminer, controller.deleteExam)

// Participant only
router.post('/submit', authenticate, requireParticipant, controller.submitExam)

// Any authenticated user
router.get('/settings', authenticate, requireAnyRole, controller.getSettings)
```

