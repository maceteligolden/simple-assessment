# Test Setup

This directory contains unit tests for the backend application using Vitest.

## Test Structure

The test files mirror the `src` folder structure:

```
test/
├── setup.ts                          # Global test setup
├── modules/
│   ├── auth/
│   │   └── auth.service.test.ts      # Auth service tests
│   └── exam/
│       └── validation/
│           └── exam.validation.test.ts
└── shared/
    └── util/
        ├── password.test.ts          # Password utility tests
        └── jwt.test.ts               # JWT utility tests
```

## Running Tests

### Run all tests
```bash
yarn test
```

### Run tests once (CI mode)
```bash
yarn test:run
```

### Run tests with UI
```bash
yarn test:ui
```

### Run tests with coverage
```bash
yarn test:coverage
```

## Writing Tests

### Test File Naming
- Test files should be named `*.test.ts` or `*.spec.ts`
- Place test files in the same relative location as the source files they test

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { YourService } from '../../../src/path/to/service'

describe('YourService', () => {
  let service: YourService

  beforeEach(() => {
    // Setup before each test
    service = new YourService()
  })

  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test'

      // Act
      const result = service.methodName(input)

      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

## Mocking

### Mocking Modules
```typescript
import { vi } from 'vitest'

vi.mock('../../../src/shared/util/password', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}))
```

### Mocking Functions
```typescript
const mockFn = vi.fn()
mockFn.mockResolvedValue('value')
mockFn.mockRejectedValue(new Error('error'))
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory. The following are excluded from coverage:
- `node_modules/`
- `dist/`
- `test/`
- `**/*.config.ts`
- `**/index.ts`
- `**/*.interface.ts`
- `**/*.model.ts`

## Environment Variables

Test environment variables are set in `test/setup.ts`. Default values are provided for:
- `NODE_ENV=test`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

## Best Practices

1. **Test Structure**: Follow the Arrange-Act-Assert pattern
2. **Test Isolation**: Each test should be independent
3. **Mocking**: Mock external dependencies (database, APIs, etc.)
4. **Naming**: Use descriptive test names that explain what is being tested
5. **Coverage**: Aim for high coverage of business logic, not just lines of code
6. **Cleanup**: Use `beforeEach` and `afterEach` to reset state between tests

