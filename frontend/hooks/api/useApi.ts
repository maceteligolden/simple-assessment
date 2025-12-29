import { useCallback, useRef } from 'react'
import {
  useAppSelector,
  useAppDispatch,
  useAppStore,
  type RootState,
} from '@/store/store'
import { refreshTokenSuccess, logout } from '@/store/slices/authSlice'
import { API_ENDPOINTS, ENV } from '@/constants'
import { RefreshTokenOutput } from '@/interfaces/auth.interface'
import { getRefreshToken, isTokenExpired } from '@/utils/token'

const API_BASE_URL = ENV.API_URL

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
  skipAutoRefresh?: boolean
}

export function useApi() {
  const accessToken = useAppSelector(state => state.auth.accessToken)
  const refreshToken = useAppSelector(state => state.auth.refreshToken)
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null)

  /**
   * Get current access token from store
   */
  const getCurrentAccessToken = useCallback((): string | null => {
    const state = store.getState() as RootState
    return state.auth.accessToken
  }, [store])

  /**
   * Refresh access token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    // If already refreshing, return the existing promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const currentRefreshToken = refreshToken || getRefreshToken()
    if (!currentRefreshToken) {
      dispatch(logout())
      return false
    }

    // Create refresh promise
    refreshPromiseRef.current = (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          }
        )

        if (!response.ok) {
          throw new Error('Token refresh failed')
        }

        const data: RefreshTokenOutput = await response.json()
        dispatch(refreshTokenSuccess(data))
        return true
      } catch (error) {
        // Refresh failed, logout user
        dispatch(logout())
        return false
      } finally {
        refreshPromiseRef.current = null
      }
    })()

    return refreshPromiseRef.current
  }, [refreshToken, dispatch])

  /**
   * Make API request with automatic token refresh
   */
  const request = useCallback(
    async <T = unknown>(
      endpoint: string,
      options: RequestOptions = {}
    ): Promise<T> => {
      const {
        requiresAuth = false,
        skipAutoRefresh = false,
        headers = {},
        ...restOptions
      } = options

      // Automatically require auth for exam endpoints
      const isExamEndpoint = endpoint.startsWith('/api/v1/exams')
      const shouldRequireAuth = requiresAuth || isExamEndpoint

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
      }

      // Get current access token
      let currentAccessToken = getCurrentAccessToken()

      // Add access token if required (explicitly or for exam endpoints)
      if (shouldRequireAuth) {
        // If token not found via callback, try direct store access
        if (!currentAccessToken) {
          const state = store.getState() as RootState
          currentAccessToken = state.auth.accessToken
        }

        if (currentAccessToken) {
          // Check if token is expired and refresh if needed
          if (!skipAutoRefresh && isTokenExpired(currentAccessToken)) {
            const refreshed = await refreshAccessToken()
            if (!refreshed) {
              throw new Error('Authentication failed. Please sign in again.')
            }
            // Get updated token after refresh
            currentAccessToken =
              getCurrentAccessToken() ||
              (store.getState() as RootState).auth.accessToken
          }

          if (currentAccessToken) {
            requestHeaders.Authorization = `Bearer ${currentAccessToken}`
          }
        } else {
          // Token is required but not available
          throw new Error('Authentication required. Please sign in again.')
        }
      }

      // Log request details for exam endpoints
      if (isExamEndpoint) {
        console.log('[API Request] Exam endpoint', {
          method: restOptions.method || 'GET',
          endpoint: `${API_BASE_URL}${endpoint}`,
          hasAuth: !!requestHeaders.Authorization,
          authHeader: requestHeaders.Authorization
            ? `${requestHeaders.Authorization.substring(0, 20)}...`
            : 'none',
          payload: restOptions.body
            ? typeof restOptions.body === 'string'
              ? JSON.parse(restOptions.body)
              : restOptions.body
            : undefined,
        })
      }

      let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers: requestHeaders,
      })

      // Log response for exam endpoints
      if (isExamEndpoint) {
        console.log('[API Response] Exam endpoint', {
          method: restOptions.method || 'GET',
          endpoint: `${API_BASE_URL}${endpoint}`,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        })
      }

      // Handle 401 Unauthorized - try to refresh token and retry
      if (response.status === 401 && shouldRequireAuth && !skipAutoRefresh) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          // Get the new token from the store
          currentAccessToken = getCurrentAccessToken()
          if (currentAccessToken) {
            requestHeaders.Authorization = `Bearer ${currentAccessToken}`
            // Retry the original request with new token
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...restOptions,
              headers: requestHeaders,
            })
          } else {
            throw new Error('Session expired. Please sign in again.')
          }
        } else {
          // Refresh failed, user will be logged out
          throw new Error('Session expired. Please sign in again.')
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          `HTTP error! status: ${response.status}`

        // Create error with status code for optimistic locking detection
        const error: any = new Error(errorMessage)
        error.status = response.status
        error.statusCode = response.status
        error.data = errorData
        throw error
      }

      let jsonResponse
      try {
        jsonResponse = await response.json()
      } catch (parseError) {
        console.error('[API Response] Failed to parse JSON response', {
          endpoint: `${API_BASE_URL}${endpoint}`,
          status: response.status,
          statusText: response.statusText,
          error: parseError,
        })
        throw new Error('Invalid JSON response from server')
      }

      // Log full response for exam endpoints to debug
      if (isExamEndpoint) {
        console.log('[API Response] Full response body', {
          endpoint: `${API_BASE_URL}${endpoint}`,
          response: jsonResponse,
          hasSuccess: 'success' in jsonResponse,
          hasData: 'data' in jsonResponse,
          hasError: 'error' in jsonResponse,
          dataType: jsonResponse.data ? typeof jsonResponse.data : 'undefined',
          dataKeys:
            jsonResponse.data && typeof jsonResponse.data === 'object'
              ? Object.keys(jsonResponse.data)
              : 'not an object',
        })
      }

      // Extract data from standardized API response format
      // Backend returns { success: true, data: {...} } or { success: false, error: {...} }
      if (
        jsonResponse &&
        jsonResponse.success === true &&
        jsonResponse.data !== undefined
      ) {
        return jsonResponse.data
      }

      // If response doesn't follow standard format, check if it's the data directly
      // Some endpoints might return data directly without the wrapper
      if (
        jsonResponse &&
        (jsonResponse.id ||
          (typeof jsonResponse === 'object' &&
            !jsonResponse.success &&
            !jsonResponse.error))
      ) {
        // If it has an id or looks like data (not an error response), return it
        return jsonResponse
      }

      // Log warning if response structure is unexpected
      if (isExamEndpoint) {
        console.warn('[API Response] Unexpected response structure', {
          endpoint: `${API_BASE_URL}${endpoint}`,
          response: jsonResponse,
          responseType: typeof jsonResponse,
        })
      }

      // If we have an error in the response, throw it
      if (jsonResponse && jsonResponse.error) {
        throw new Error(jsonResponse.error.message || 'API request failed')
      }

      return jsonResponse
    },
    [getCurrentAccessToken, refreshAccessToken]
  )

  const get = useCallback(
    <T = unknown>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'GET' }),
    [request]
  )

  const post = useCallback(
    <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
    [request]
  )

  const put = useCallback(
    <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
    [request]
  )

  const patch = useCallback(
    <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }),
    [request]
  )

  const del = useCallback(
    <T = unknown>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),
    [request]
  )

  return {
    get,
    post,
    put,
    patch,
    delete: del,
  }
}
