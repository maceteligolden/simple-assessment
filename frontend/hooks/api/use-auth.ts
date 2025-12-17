import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/store'
import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
} from '@/store/slices/authSlice'
import { useApi } from './use-api'
import { API_ENDPOINTS } from '@/constants'
import { LoginCredentials, RegisterData, AuthResponse } from '@/interfaces'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, isLoading, error } = useAppSelector(
    (state) => state.auth
  )
  const api = useApi()

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch(loginStart())
      try {
        const response = await api.post<AuthResponse>(
          API_ENDPOINTS.AUTH.LOGIN,
          credentials
        )
        dispatch(loginSuccess(response))
        return { success: true }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Login failed'
        dispatch(loginFailure(errorMessage))
        return { success: false, error: errorMessage }
      }
    },
    [api, dispatch]
  )

  const register = useCallback(
    async (data: RegisterData) => {
      dispatch(registerStart())
      try {
        const response = await api.post<AuthResponse>(
          API_ENDPOINTS.AUTH.REGISTER,
          data
        )
        dispatch(registerSuccess(response))
        return { success: true }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed'
        dispatch(registerFailure(errorMessage))
        return { success: false, error: errorMessage }
      }
    },
    [api, dispatch]
  )

  const logoutUser = useCallback(() => {
    dispatch(logout())
  }, [dispatch])

  return {
    login,
    register,
    logout: logoutUser,
    isAuthenticated,
    user,
    isLoading,
    error,
  }
}

