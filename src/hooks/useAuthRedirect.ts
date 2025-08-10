'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Hook to handle authentication-based redirects
 * @param options Configuration options for the redirect behavior
 * @param options.requireAuth Whether the current page requires authentication (default: false)
 * @param options.redirectTo Where to redirect if auth requirements are not met (default: '/login')
 * @param options.redirectIfAuthenticated Whether to redirect if user is authenticated (for auth pages like login/register)
 * @param options.redirectIfAuthenticatedTo Where to redirect if user is authenticated (default: '/')
 */
export function useAuthRedirect({
  requireAuth = false,
  redirectTo = '/login',
  redirectIfAuthenticated = false,
  redirectIfAuthenticatedTo = '/',
} = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip if session is still loading
    if (status === 'loading') return

    // Handle redirect for authenticated users (e.g., away from login/register)
    if (redirectIfAuthenticated && status === 'authenticated') {
      router.replace(redirectIfAuthenticatedTo)
      return
    }

    // Handle redirect for unauthenticated users
    if (requireAuth && status === 'unauthenticated') {
      // Store the current path for redirecting back after login
      const callbackUrl = pathname ? encodeURIComponent(pathname) : '/'
      const redirectUrl = `${redirectTo}?callbackUrl=${callbackUrl}`
      router.replace(redirectUrl)
    }
  }, [status, requireAuth, redirectTo, redirectIfAuthenticated, redirectIfAuthenticatedTo, router, pathname])

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
