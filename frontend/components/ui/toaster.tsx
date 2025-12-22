'use client'

import { useToast } from '@/hooks/ui/useToast'
import { ToastComponent } from './toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}
