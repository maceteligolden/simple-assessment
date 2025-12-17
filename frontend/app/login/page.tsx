'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/api'
import { BYPASS_AUTH } from '@/constants/test.constants'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!BYPASS_AUTH && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  if (!BYPASS_AUTH && isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <LoginForm />
    </main>
  )
}

