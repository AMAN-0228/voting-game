'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import SocketProvider from '@/providers/SocketProvider'
import AuthGuard from '@/providers/AuthGuard'

interface ProvidersProps {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthGuard>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthGuard>
      <Toaster richColors />
    </ThemeProvider>
  )
}
