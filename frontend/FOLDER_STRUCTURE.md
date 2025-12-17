# Frontend Folder Structure

This document outlines the folder structure for the frontend application.

## 📁 Complete Folder Structure

```
frontend/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout with Redux provider
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles with Tailwind CSS
│
├── components/                   # React components organized by modules
│   ├── ui/                      # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── index.ts
│   ├── auth/                    # Authentication module components
│   │   └── .gitkeep
│   ├── exam/                    # Exam module components
│   │   └── .gitkeep
│   ├── dashboard/               # Dashboard module components
│   │   └── .gitkeep
│   ├── layout/                  # Layout components (Header, Footer, etc.)
│   │   └── .gitkeep
│   └── index.ts                 # Component exports
│
├── hooks/                       # Custom React hooks
│   ├── api/                     # API-related hooks
│   │   ├── use-api.ts          # Main API hook (stub)
│   │   └── index.ts
│   └── ui/                      # UI-related hooks
│       ├── use-toast.ts        # Toast notifications hook (stub)
│       ├── use-dialog.ts       # Dialog state management hook
│       └── index.ts
│
├── store/                       # Redux store configuration
│   ├── store.ts                # Store setup and typed hooks
│   └── provider.tsx            # Redux provider component
│
├── interfaces/                 # TypeScript interfaces/types
│   ├── user.interface.ts       # User-related interfaces
│   ├── exam.interface.ts       # Exam-related interfaces
│   └── index.ts                # Interface exports
│
├── constants/                   # Application constants
│   ├── api.constants.ts        # API endpoint constants
│   ├── app.constants.ts        # App configuration constants
│   └── index.ts                # Constant exports
│
├── lib/                         # Library utilities
│   └── utils.ts                # Utility functions (cn for class merging)
│
├── utils/                       # Application utilities
│   ├── format.ts               # Formatting utilities (stubs)
│   └── index.ts
│
├── components.json              # shadcn/ui configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Environment variables example
└── SETUP.md                    # Setup documentation
```

## 📂 Module Organization

### Components by Module

- **`components/auth/`** - Authentication-related components
  - LoginForm, RegisterForm, AuthGuard, etc.

- **`components/exam/`** - Exam-related components
  - ExamCard, QuestionForm, ExamTimer, ExamResults, etc.

- **`components/dashboard/`** - Dashboard components
  - DashboardStats, ExamList, ResultsTable, etc.

- **`components/layout/`** - Layout components
  - Header, Footer, Sidebar, Navigation, etc.

- **`components/ui/`** - Base UI components (shadcn/ui)
  - Button, Card, Input, and other reusable components

## 🎣 Hooks Organization

- **`hooks/api/`** - API-related hooks
  - `useApi` - Main API client hook

- **`hooks/ui/`** - UI-related hooks
  - `useToast` - Toast notification hook
  - `useDialog` - Dialog state management hook

## 🔄 State Management

- **`store/`** - Redux store
  - `store.ts` - Store configuration and typed hooks
  - `provider.tsx` - Redux provider wrapper
  - `slices/` - (To be created) Redux slices for features

## 📝 Types & Constants

- **`interfaces/`** - TypeScript interfaces
  - User interfaces
  - Exam interfaces
  - Other domain interfaces

- **`constants/`** - Application constants
  - API endpoints
  - App configuration
  - Storage keys
  - Feature flags

## 🛠️ Utilities

- **`lib/`** - Library utilities
  - `utils.ts` - Class name utilities (cn function)

- **`utils/`** - Application utilities
  - Formatting functions
  - Helper functions

## 📋 Notes

- All logic implementations have been removed/stubbed
- Focus is on folder structure and organization
- Components, hooks, and utilities are ready for implementation
- Configuration files are set up and ready to use

