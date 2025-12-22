'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SignupForm from '@/components/auth/SignupForm'
import { UserRole } from '@/interfaces'
import { GraduationCap, Users } from 'lucide-react'
import { USER_ROLES } from '@/constants/app.constants'

export default function SignupPage() {
  // Middleware handles redirect for authenticated users
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  // Role selection screen
  if (!selectedRole) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create an Account</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your account type to get started
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => setSelectedRole(USER_ROLES.EXAMINER)}
            >
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
                    <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <CardTitle className="text-center">Examiner</CardTitle>
                <CardDescription className="text-center">
                  Create and manage exams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Create exams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Manage participants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>View exam analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Take exams</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => setSelectedRole(USER_ROLES.PARTICIPANT)}
            >
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                    <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-center">Participant</CardTitle>
                <CardDescription className="text-center">
                  Take exams and view results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Take exams with access codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>View your results</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Track exam history</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Signup form screen
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedRole(null)}
            className="mb-4"
          >
            ← Back to role selection
          </Button>
        </div>
        <SignupForm role={selectedRole} />
      </div>
    </main>
  )
}
