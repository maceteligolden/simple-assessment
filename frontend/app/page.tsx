'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/api'

export default function Home() {
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
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Simple Assessment Platform
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
          Welcome to the online exam platform
        </p>

        <Card className="p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-6">
            Get Started
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sign in to your account or create a new one to get started
          </p>
          <div className="space-y-4">
            <Link href="/login" className="block">
              <Button className="w-full" size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" className="block">
              <Button className="w-full" variant="outline" size="lg">
                Sign Up
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}

