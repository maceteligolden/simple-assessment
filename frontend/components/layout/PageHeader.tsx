'use client'

import { ReactNode } from 'react'
import { useAppSelector } from '@/store/store'

interface PageHeaderProps {
  title: string
  description?: string
  showWelcome?: boolean
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  showWelcome = false,
  actions,
  className = '',
}: PageHeaderProps) {
  const user = useAppSelector(state => state.auth.user)

  const welcomeMessage =
    showWelcome && user?.firstName && user?.lastName
      ? `Welcome back, ${user.firstName} ${user.lastName}!`
      : showWelcome
        ? 'Welcome!'
        : undefined

  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          )}
          {welcomeMessage && (
            <p className="text-gray-600 dark:text-gray-400">{welcomeMessage}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
