/**
 * Test Configuration
 * Set to true to bypass authentication for testing purposes
 * Can be overridden via NEXT_PUBLIC_BYPASS_AUTH environment variable
 * In development, this can be toggled via localStorage
 * 
 * Note: This is evaluated at module load time. For reactive updates,
 * use the useBypassAuth hook instead.
 */
import { ENV } from './env.constants'

const getBypassAuthValue = (): boolean => {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable only
    return ENV.BYPASS_AUTH
  }
  // Client-side: check localStorage first (for runtime toggle in dev)
  const localStorageValue = localStorage.getItem('bypass_auth')
  if (localStorageValue !== null) {
    return localStorageValue === 'true'
  }
  // Fallback to environment variable
  return ENV.BYPASS_AUTH
}

export const BYPASS_AUTH = getBypassAuthValue()

/**
 * Get current bypass auth state (reactive)
 * Use this in components that need to react to changes
 */
export function getBypassAuth(): boolean {
  return getBypassAuthValue()
}

/**
 * Toggle auth bypass (for development/testing)
 */
export function toggleBypassAuth(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('bypass_auth', 'true')
    } else {
      localStorage.removeItem('bypass_auth')
    }
    // Reload to apply changes
    window.location.reload()
  }
}

