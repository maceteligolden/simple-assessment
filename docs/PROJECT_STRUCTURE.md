# Project Structure

The project is split into a Next.js frontend and an Express TypeScript backend.

## 1. Backend Structure (`/backend`)
- **`src/index.ts`**: App entry point and middleware configuration.
- **`src/modules/`**: Feature-based modules (Auth, Exam). Each contains its own:
  - `controllers/`
  - `services/`
  - `routes/`
  - `interfaces/`
- **`src/shared/`**: Global resources.
  - `model/`: Mongoose schemas.
  - `repository/`: Data access layer.
  - `middleware/`: Auth, validation, error handlers.
  - `util/`: Logger, database connection, JWT helpers.

## 2. Frontend Structure (`/frontend`)
- **`app/`**: Next.js App Router pages and layouts.
- **`components/`**: UI components organized by feature (Auth, Dashboard, Exam).
- **`store/`**: Redux Toolkit slices for global state management.
- **`hooks/`**: Custom hooks for API integration and UI logic.
- **`utils/`**: Formatting, token management, and cookie helpers.

## 3. Design Principles
- **Separation of Concerns**: Controllers handle HTTP, Services handle logic, Repositories handle data.
- **Dependency Injection**: Using `tsyringe` for decoupled component management in the backend.
- **Clean Code**: Consistent naming and folder patterns across all modules.

