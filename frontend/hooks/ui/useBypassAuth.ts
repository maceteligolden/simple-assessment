import { useState, useEffect } from 'react'
import { getBypassAuth, toggleBypassAuth } from '@/constants/test.constants'

/**
 * Hook to get and toggle bypass auth state
 * Use this in components that need to react to bypass auth changes
 */
export function useBypassAuth() {
  const [bypassAuth, setBypassAuth] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setBypassAuth(getBypassAuth())
  }, [])

  const toggle = (enabled: boolean) => {
    // Update state optimistically (page will reload anyway)
    setBypassAuth(enabled)
    toggleBypassAuth(enabled)
  }

  return {
    bypassAuth: mounted ? bypassAuth : false,
    toggle,
    mounted,
  }
}

