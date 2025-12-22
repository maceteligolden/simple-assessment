'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/api'
import { UserRole } from '@/interfaces'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

/**
 * Protected Route Component
 * Wraps pages/components that require authentication
 * Optionally restricts access based on user roles
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      // Check role restrictions
      if (allowedRoles && allowedRoles.length > 0 && user) {
        if (!allowedRoles.includes(user.role)) {
          // User doesn't have required role, redirect to dashboard or home
          router.push('/dashboard')
          return
        }
      }
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, redirectTo, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated or wrong role - don't render children
  if (!isAuthenticated) {
    return null
  }

  // Check role restrictions
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      return null
    }
  }

  // Render protected content
  return <>{children}</>
}
