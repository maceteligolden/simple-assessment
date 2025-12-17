import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User, AuthResponse } from '@/interfaces'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Load auth state from localStorage on initialization
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('auth_user')
  if (storedToken && storedUser) {
    try {
      initialState.token = storedToken
      initialState.user = JSON.parse(storedUser)
      initialState.isAuthenticated = true
    } catch (error) {
      // Clear invalid stored data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.error = null

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', action.payload.token)
        localStorage.setItem('auth_user', JSON.stringify(action.payload.user))
      }
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = action.payload
    },
    registerStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    registerSuccess: (state, action: PayloadAction<AuthResponse>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.error = null

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', action.payload.token)
        localStorage.setItem('auth_user', JSON.stringify(action.payload.user))
      }
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = action.payload
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = null

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  clearError,
} = authSlice.actions

export default authSlice.reducer

