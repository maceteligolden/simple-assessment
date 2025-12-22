'use client'

import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  // Middleware handles redirect for authenticated users

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <LoginForm />
    </main>
  )
}
