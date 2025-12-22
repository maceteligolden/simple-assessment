'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, GraduationCap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/api'
import { UserRole } from '@/interfaces'
import { useToast } from '@/hooks/ui/useToast'
import { USER_ROLES } from '@/constants/app.constants'

interface SignupFormProps {
  role: UserRole
}

export default function SignupForm({ role }: SignupFormProps) {
  const router = useRouter()
  const { signUp, isLoading, error } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: role,
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const result = await signUp(formData)
    if (result.success) {
      toastSuccess(
        `Account created successfully! Welcome, ${formData.firstName}!`
      )
      router.push('/dashboard')
    } else {
      toastError(result.error || 'Failed to create account. Please try again.')
    }
  }

  const roleLabel = role === USER_ROLES.EXAMINER ? 'Examiner' : 'Participant'
  const RoleIcon = role === USER_ROLES.EXAMINER ? GraduationCap : Users

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div
              className={`rounded-full p-3 ${
                role === USER_ROLES.EXAMINER
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              <RoleIcon
                className={`h-6 w-6 ${
                  role === USER_ROLES.EXAMINER
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sign Up as {roleLabel}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {role === USER_ROLES.EXAMINER
              ? 'Create and manage your exams'
              : 'Start taking exams and track your progress'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium mb-2"
            >
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={e =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Enter your first name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium mb-2"
            >
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={e =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Enter your last name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

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
    </div>
  )
}
