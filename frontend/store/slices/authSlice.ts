import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  UserProfileOutput,
  SignUpOutput,
  SignInOutput,
  RefreshTokenOutput,
} from '@/interfaces/auth.interface'
import { STORAGE_KEYS } from '@/constants/app.constants'
import { setAuthCookie, removeAuthCookie } from '@/utils/cookies'

interface AuthState {
  user: UserProfileOutput | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Load auth state from localStorage on initialization
if (typeof window !== 'undefined') {
  const storedAccessToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
  if (storedAccessToken && storedUser) {
    try {
      initialState.accessToken = storedAccessToken
      initialState.refreshToken = storedRefreshToken || null
      initialState.user = JSON.parse(storedUser)
      initialState.isAuthenticated = true
      // Set cookie for middleware
      setAuthCookie(storedAccessToken)
    } catch (error) {
      // Clear invalid stored data
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      removeAuthCookie()
    }
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signUpStart: state => {
      state.isLoading = true
      state.error = null
    },
    signUpSuccess: (state, action: PayloadAction<SignUpOutput>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.error = null

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.AUTH_TOKEN,
          action.payload.accessToken
        )
        localStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          action.payload.refreshToken
        )
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(action.payload.user)
        )
      }
    },
    signUpFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.error = action.payload
    },
    signInStart: state => {
      state.isLoading = true
      state.error = null
    },
    signInSuccess: (state, action: PayloadAction<SignInOutput>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.error = null

      // Store in localStorage and set cookie
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.AUTH_TOKEN,
          action.payload.accessToken
        )
        localStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          action.payload.refreshToken
        )
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(action.payload.user)
        )
        // Set cookie for middleware
        setAuthCookie(action.payload.accessToken)
      }
    },
    signInFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.error = action.payload
    },
    refreshTokenSuccess: (state, action: PayloadAction<RefreshTokenOutput>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken

      // Update localStorage and cookie
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.AUTH_TOKEN,
          action.payload.accessToken
        )
        localStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          action.payload.refreshToken
        )
        // Update cookie for middleware
        setAuthCookie(action.payload.accessToken)
      }
    },
    logout: state => {
      state.isAuthenticated = false
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.error = null

      // Clear localStorage and cookie
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        // Remove cookie for middleware
        removeAuthCookie()
      }
    },
    clearError: state => {
      state.error = null
    },
    // Legacy actions for backward compatibility
    loginStart: state => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<SignInOutput>) => {
      authSlice.caseReducers.signInSuccess(state, action)
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      authSlice.caseReducers.signInFailure(state, action)
    },
    registerStart: state => {
      state.isLoading = true
      state.error = null
    },
    registerSuccess: (state, action: PayloadAction<SignUpOutput>) => {
      authSlice.caseReducers.signUpSuccess(state, action)
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      authSlice.caseReducers.signUpFailure(state, action)
    },
  },
})

export const {
  signUpStart,
  signUpSuccess,
  signUpFailure,
  signInStart,
  signInSuccess,
  signInFailure,
  refreshTokenSuccess,
  logout,
  clearError,
  // Legacy exports
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
} = authSlice.actions

export default authSlice.reducer
