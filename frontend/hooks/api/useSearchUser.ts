import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/constants'
import { UserProfileOutput } from '@/interfaces/auth.interface'

interface SearchUserResponse {
  user: UserProfileOutput | null
  exists: boolean
}

export function useSearchUser() {
  const api = useApi()
  const apiRef = useRef(api)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<UserProfileOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Keep api ref up to date
  useEffect(() => {
    apiRef.current = api
  }, [api])

  const searchUser = useCallback(
    async (email: string): Promise<{ user: UserProfileOutput | null; exists: boolean }> => {
      if (!email || !email.trim()) {
        setSearchResult(null)
        setError(null)
        return { user: null, exists: false }
      }

      try {
        setIsSearching(true)
        setError(null)

        const response = await apiRef.current.get<SearchUserResponse>(
          `${API_ENDPOINTS.AUTH.SEARCH}?email=${encodeURIComponent(email.trim())}`,
          { requiresAuth: true }
        )

        setSearchResult(response.user || null)
        return { user: response.user || null, exists: response.exists || false }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to search user'
        setError(errorMessage)
        setSearchResult(null)
        return { user: null, exists: false }
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  return {
    searchUser,
    searchResult,
    isSearching,
    error,
  }
}

