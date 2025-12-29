import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/store'
import {
  signUpStart,
  signUpSuccess,
  signUpFailure,
  signInStart,
  signInSuccess,
  signInFailure,
  refreshTokenSuccess,
  logout,
} from '@/store/slices/authSlice'
import { useApi } from './useApi'
import { API_ENDPOINTS, USER_ROLES } from '@/constants'
import {
  SignUpInput,
  SignUpOutput,
  SignInInput,
  SignInOutput,
  RefreshTokenInput,
  RefreshTokenOutput,
  UserProfileOutput,
} from '@/interfaces/auth.interface'
import { useBypassAuth } from '@/hooks/ui/useBypassAuth'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, isLoading, error, accessToken, refreshToken } =
    useAppSelector(state => state.auth)
  const api = useApi()
  const { bypassAuth } = useBypassAuth()

  // Determine user role and role-based flags
  const activeRole = useMemo(() => {
    if (bypassAuth || !isAuthenticated || !user?.role) {
      return null
    }
    return user.role
  }, [bypassAuth, isAuthenticated, user?.role])

  const isExaminer = useMemo(() => {
    return !bypassAuth && isAuthenticated && user?.role === USER_ROLES.EXAMINER
  }, [bypassAuth, isAuthenticated, user?.role])

  const isParticipant = useMemo(() => {
    return !bypassAuth && isAuthenticated && user?.role !== USER_ROLES.EXAMINER
  }, [bypassAuth, isAuthenticated, user?.role])

  /**
   * Sign up a new user
   */
  const signUp = useCallback(
    async (data: SignUpInput) => {
      dispatch(signUpStart())
      try {
        const response = await api.post<SignUpOutput>(
          API_ENDPOINTS.AUTH.SIGNUP,
          data
        )
        dispatch(signUpSuccess(response))
        return { success: true }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed'
        dispatch(signUpFailure(errorMessage))
        return { success: false, error: errorMessage }
      }
    },
    [api, dispatch]
  )

  /**
   * Sign in an existing user
   */
  const signIn = useCallback(
    async (data: SignInInput) => {
      dispatch(signInStart())
      try {
        const response = await api.post<SignInOutput>(
          API_ENDPOINTS.AUTH.SIGNIN,
          data
        )
        dispatch(signInSuccess(response))
        return { success: true }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Sign in failed'
        dispatch(signInFailure(errorMessage))
        return { success: false, error: errorMessage }
      }
    },
    [api, dispatch]
  )

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = refreshToken || getRefreshToken()
    if (!currentRefreshToken) {
      return false
    }

    try {
      const response = await api.post<RefreshTokenOutput>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken: currentRefreshToken } as RefreshTokenInput
      )
      dispatch(refreshTokenSuccess(response))
      return true
    } catch (err) {
      // Refresh failed, logout user
      dispatch(logout())
      return false
    }
  }, [api, dispatch, refreshToken])

  /**
   * Get user profile
   */
  const getProfile = useCallback(async () => {
    try {
      const response = await api.get<UserProfileOutput>(
        API_ENDPOINTS.AUTH.PROFILE,
        { requiresAuth: true }
      )
      return { success: true, data: response }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch profile'
      return { success: false, error: errorMessage }
    }
  }, [api])

  /**
   * Sign out (logout)
   */
  const signOut = useCallback(async () => {
    try {
      // Call backend API to revoke session
      await api.post(API_ENDPOINTS.AUTH.SIGNOUT, {}, { requiresAuth: true })
    } catch (err) {
      // Even if API call fails, still logout locally
      console.error('Logout API call failed:', err)
    } finally {
      // Always dispatch logout to clear local state
      dispatch(logout())
    }
  }, [api, dispatch])

  /**
   * Legacy methods for backward compatibility
   */
  const login = useCallback(
    async (credentials: SignInInput) => {
      return signIn(credentials)
    },
    [signIn]
  )

  const register = useCallback(
    async (data: SignUpInput) => {
      return signUp(data)
    },
    [signUp]
  )

  const logoutUser = useCallback(async () => {
    await signOut()
  }, [signOut])

  return {
    // New methods
    signUp,
    signIn,
    signOut,
    refreshAccessToken,
    getProfile,
    // Legacy methods
    login,
    register,
    logout: logoutUser,
    // State
    isAuthenticated,
    user,
    isLoading,
    error,
    accessToken,
    refreshToken,
    // Role information
    activeRole,
    isExaminer,
    isParticipant,
    bypassAuth,
  }
}

// Helper function to get refresh token from storage
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}
