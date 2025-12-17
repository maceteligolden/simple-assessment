'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout'
import { ExamList } from '@/components/dashboard'
import { useAuth, useExams } from '@/hooks/api'
import { BYPASS_AUTH } from '@/constants/test.constants'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { exams, isLoading, error } = useExams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !BYPASS_AUTH && !isAuthenticated) {
      router.push('/')
    }
  }, [mounted, isAuthenticated, router])

  if (!mounted) {
    return null
  }

  if (!BYPASS_AUTH && (!isAuthenticated || !user)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {BYPASS_AUTH
              ? 'Welcome! (Test Mode - Auth Bypassed)'
              : `Welcome back, ${user?.firstName} ${user?.lastName}!`}
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Link href="/dashboard/exams/create">
            <Button>Create New Exam</Button>
          </Link>
          <Link href="/dashboard/exams/start">
            <Button variant="outline">Start an Exam</Button>
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">My Exams</h2>
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}
          <ExamList exams={exams} isLoading={isLoading} />
        </div>
      </main>
    </div>
  )
}

