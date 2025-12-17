import { useCallback } from 'react'
import { useAppSelector } from '@/store/store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5008'

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

export function useApi() {
  const token = useAppSelector((state) => state.auth.token)

  const request = useCallback(
    async <T = unknown>(
      endpoint: string,
      options: RequestOptions = {}
    ): Promise<T> => {
      const { requiresAuth = false, headers = {}, ...restOptions } = options

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
      }

      if (requiresAuth && token) {
        requestHeaders.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers: requestHeaders,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      return response.json()
    },
    [token]
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
