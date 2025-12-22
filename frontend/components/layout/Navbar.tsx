'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/api'

export default function Navbar() {
  const router = useRouter()
  const { logout, isAuthenticated, user, isExaminer } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  // Don't render navbar if user is not authenticated
  if (!mounted || !isAuthenticated) {
    return null
  }

  return (
    <nav className="border-b bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold">
              Simple Assessment
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {mounted && isExaminer && (
              <Link href="/dashboard/exams/create">
                <Button variant="outline" size="sm">
                  Create Exam
                </Button>
              </Link>
            )}

            {mounted && !isExaminer && (
              <Link href="/dashboard/exams/start">
                <Button size="sm">Start Exam</Button>
              </Link>
            )}

            <Link href="/dashboard/my-exams">
              <Button variant="ghost" size="sm">
                My Exams
              </Button>
            </Link>
            {mounted && (
              <div className="flex items-center gap-2 border-l pl-4 ml-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : 'User'}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
