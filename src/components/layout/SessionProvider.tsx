'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useSession, SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

// Create a stable context for session data
interface SessionContextValue {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isAuthenticated: boolean
  user: Session['user'] | null
}

const SessionContext = createContext<SessionContextValue | null>(null)

// Custom hook to access session data
export const useSessionContext = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSessionContext must be used within SessionProvider')
  }
  return context
}

// Optimized session provider that minimizes re-renders
function OptimizedSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    session,
    status,
    isAuthenticated: status === 'authenticated',
    user: session?.user || null
  }), [session, status])

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

// Main session provider wrapper
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <OptimizedSessionProvider>
        {children}
      </OptimizedSessionProvider>
    </NextAuthSessionProvider>
  )
}
