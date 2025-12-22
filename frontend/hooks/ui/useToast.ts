'use client'

import { useState, useCallback, useEffect } from 'react'
import { Toast, ToastType } from '@/components/ui/toast'

let toastIdCounter = 0

// Global toast state (singleton pattern)
let globalToasts: Toast[] = []
let listeners: Array<() => void> = []

const notify = () => {
  listeners.forEach((listener) => listener())
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts)

  // Subscribe to global toast changes
  useEffect(() => {
    const listener = () => {
      setToasts([...globalToasts])
    }
    listeners.push(listener)
    // Initialize with current toasts
    setToasts([...globalToasts])
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const toast = useCallback(
    ({
      title,
      description,
      type = 'info',
      duration = 5000,
    }: {
      title?: string
      description: string
      type?: ToastType
      duration?: number
    }) => {
      const id = `toast-${++toastIdCounter}`
      const newToast: Toast = {
        id,
        title,
        description,
        type,
        duration,
      }

      globalToasts = [...globalToasts, newToast]
      notify()

      return id
    },
    []
  )

  const dismiss = useCallback((id: string) => {
    globalToasts = globalToasts.filter((toast) => toast.id !== id)
    notify()
  }, [])

  const success = useCallback(
    (description: string, title?: string) => {
      return toast({ title, description, type: 'success' })
    },
    [toast]
  )

  const error = useCallback(
    (description: string, title?: string) => {
      return toast({ title, description, type: 'error' })
    },
    [toast]
  )

  const info = useCallback(
    (description: string, title?: string) => {
      return toast({ title, description, type: 'info' })
    },
    [toast]
  )

  const warning = useCallback(
    (description: string, title?: string) => {
      return toast({ title, description, type: 'warning' })
    },
    [toast]
  )

  return {
    toasts,
    toast,
    dismiss,
    success,
    error,
    info,
    warning,
  }
}

// Convenience function for use outside of React components
export function toast({
  title,
  description,
  type = 'info',
  duration = 5000,
}: {
  title?: string
  description: string
  type?: ToastType
  duration?: number
}) {
  const id = `toast-${++toastIdCounter}`
  const newToast: Toast = {
    id,
    title,
    description,
    type,
    duration,
  }

  globalToasts = [...globalToasts, newToast]
  notify()

  return id
}
