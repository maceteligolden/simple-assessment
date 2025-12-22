import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { useAppSelector } from '@/store/store'
import { isTokenExpired } from '@/utils/token'

/**
 * Hook to automatically refresh access token before it expires
 * Checks token expiration every 5 minutes and refreshes if needed
 */
export function useTokenRefresh() {
  const { refreshAccessToken } = useAuth()
  const accessToken = useAppSelector(state => state.auth.accessToken)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Clear interval if not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Function to check and refresh token
    const checkAndRefreshToken = async () => {
      if (accessToken && isTokenExpired(accessToken)) {
        // Token is expired, try to refresh
        await refreshAccessToken()
      } else if (accessToken) {
        // Check if token will expire in the next 5 minutes
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          const exp = payload.exp * 1000 // Convert to milliseconds
          const timeUntilExpiry = exp - Date.now()
          const fiveMinutes = 5 * 60 * 1000

          // If token expires in less than 5 minutes, refresh it
          if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
            await refreshAccessToken()
          }
        } catch (error) {
          // If we can't parse the token, try to refresh
          await refreshAccessToken()
        }
      }
    }

    // Check immediately
    checkAndRefreshToken()

    // Set up interval to check every 5 minutes
    intervalRef.current = setInterval(checkAndRefreshToken, 5 * 60 * 1000)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAuthenticated, accessToken, refreshAccessToken])
}
