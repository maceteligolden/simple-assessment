/**
 * Cookie utility functions for authentication
 * These cookies are used by Next.js middleware to check authentication status
 */

import { ENV, ENVIRONMENT } from '@/constants/env.constants'

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
  sameSite: 'lax' as const,
  secure: ENV.NODE_ENV === ENVIRONMENT.PRODUCTION,
}

/**
 * Set authentication token cookie
 */
export function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return

  const expires = new Date()
  expires.setTime(expires.getTime() + COOKIE_OPTIONS.maxAge * 1000)

  document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=${COOKIE_OPTIONS.path}; SameSite=${COOKIE_OPTIONS.sameSite}${COOKIE_OPTIONS.secure ? '; Secure' : ''}`
}

/**
 * Remove authentication token cookie
 */
export function removeAuthCookie(): void {
  if (typeof document === 'undefined') return

  document.cookie = `auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${COOKIE_OPTIONS.path}; SameSite=${COOKIE_OPTIONS.sameSite}${COOKIE_OPTIONS.secure ? '; Secure' : ''}`
}

/**
 * Get authentication token from cookie (client-side only)
 */
export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie =>
    cookie.trim().startsWith('auth_token=')
  )

  if (!authCookie) return null

  return authCookie.split('=')[1] || null
}
