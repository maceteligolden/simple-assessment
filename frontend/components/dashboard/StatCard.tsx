'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  valueColor,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {label}
            </p>
            <p
              className={`text-3xl font-bold ${
                valueColor || 'text-gray-900 dark:text-white'
              }`}
            >
              {value}
            </p>
          </div>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  )
}
