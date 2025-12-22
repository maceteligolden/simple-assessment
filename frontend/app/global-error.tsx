'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { isDevelopment } from '@/constants/env.constants'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Critical Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                A critical error occurred in the application. Please refresh the
                page or return to the home page.
              </p>

              {error.digest && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    Error ID: {error.digest}
                  </p>
                </div>
              )}

              {isDevelopment() && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-xs text-red-800 dark:text-red-300 font-mono break-all">
                    {error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={reset} className="flex-1" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Link href="/" className="flex-1">
                  <Button className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
