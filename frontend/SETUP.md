# Frontend Setup Guide

This document outlines the frontend setup and structure.

## 🎨 shadcn/ui Setup

shadcn/ui has been configured with:
- Tailwind CSS configuration
- Component configuration (`components.json`)
- Base UI components (Button, Card, Input)
- Utility functions (`lib/utils.ts`)

### Adding More shadcn/ui Components

To add more components from shadcn/ui, run:
```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
```

## 🔄 Redux Toolkit Setup

Redux Toolkit is configured with:
- Store setup (`store/store.ts`)
- Provider component (`store/provider.ts`)
- Typed hooks (`useAppDispatch`, `useAppSelector`, `useAppStore`)

### Adding Redux Slices

Create slices in `store/slices/` directory:
```typescript
// store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    // your reducers
  },
})

export default authSlice.reducer
```

Then import in `store/store.ts`:
```typescript
import authReducer from './slices/authSlice'

reducer: {
  auth: authReducer,
}
```

## 📁 Folder Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Redux provider
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles with Tailwind
│
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── auth/             # Authentication components
│   ├── exam/             # Exam-related components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components (Header, Footer)
│   └── index.ts          # Component exports
│
├── hooks/                # Custom React hooks
│   ├── api/              # API-related hooks
│   │   └── use-api.ts    # Main API hook
│   └── ui/               # UI-related hooks
│       ├── use-toast.ts  # Toast notifications
│       └── use-dialog.ts # Dialog management
│
├── store/                # Redux store
│   ├── store.ts          # Store configuration
│   └── provider.tsx      # Redux provider component
│
├── interfaces/           # TypeScript interfaces
│   ├── user.interface.ts
│   ├── exam.interface.ts
│   └── index.ts
│
├── constants/            # Application constants
│   ├── api.constants.ts  # API endpoints
│   ├── app.constants.ts  # App configuration
│   └── index.ts
│
├── lib/                  # Library utilities
│   └── utils.ts          # Utility functions (cn, etc.)
│
└── utils/                # Application utilities
    ├── format.ts         # Formatting utilities
    └── index.ts
```

## 🎣 Hooks Usage

### API Hooks

```typescript
import { useApi } from '@/hooks/api'

function MyComponent() {
  const { get, post } = useApi()

  const fetchData = async () => {
    try {
      const data = await get('/api/exams', true) // requiresAuth = true
      console.log(data)
    } catch (error) {
      console.error(error)
    }
  }

  const createExam = async () => {
    try {
      const result = await post('/api/exams', { title: 'Test' }, true)
      console.log(result)
    } catch (error) {
      console.error(error)
    }
  }
}
```

### UI Hooks

```typescript
import { useToast, useDialog } from '@/hooks/ui'

function MyComponent() {
  const { toast } = useToast()
  const dialog = useDialog()

  const showSuccess = () => {
    toast({
      title: 'Success!',
      description: 'Operation completed successfully',
    })
  }

  return (
    <div>
      <button onClick={dialog.open}>Open Dialog</button>
      {dialog.isOpen && <div>Dialog content</div>}
    </div>
  )
}
```

## 🔧 Environment Variables

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📦 Dependencies

Key dependencies:
- `next` - Next.js framework
- `react` & `react-dom` - React library
- `@reduxjs/toolkit` - Redux Toolkit
- `react-redux` - React bindings for Redux
- `tailwindcss` - CSS framework
- `class-variance-authority` - Component variants
- `clsx` & `tailwind-merge` - Class name utilities
- `lucide-react` - Icons

## 🚀 Next Steps

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Create Redux slices for your features (auth, exam, etc.)

3. Build out components in their respective module folders

4. Use the API hooks to connect to your backend

5. Add more shadcn/ui components as needed

