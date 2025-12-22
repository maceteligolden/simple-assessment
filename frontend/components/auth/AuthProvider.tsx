'use client'

import { ReactNode } from 'react'
import { useTokenRefresh } from '@/hooks/api/useTokenRefresh'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider Component
 * Handles automatic token refresh for authenticated users
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  useTokenRefresh()

  return <>{children}</>
}
