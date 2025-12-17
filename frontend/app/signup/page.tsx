'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SignupForm from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/api'

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <SignupForm />
    </main>
  )
}

