import type { Metadata } from 'next'
import './globals.css'
import StoreProvider from '@/store/provider'

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
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}

