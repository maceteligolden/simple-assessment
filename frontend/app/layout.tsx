import type { Metadata } from 'next'
import './globals.css'
import StoreProvider from '@/store/provider'
import AuthProvider from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { Navbar } from '@/components/layout'

export const metadata: Metadata = {
  title: 'Simple Assessment Platform',
  description: 'A minimal online exam and assessment platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <Toaster />
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
