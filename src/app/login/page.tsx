'use client'

import Link from 'next/link'
import { AuthForm } from '@/components/auth/AuthForm'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'

export default function LoginPage() {
  // Redirect if already authenticated
  useAuthRedirect({
    redirectIfAuthenticated: true,
    redirectIfAuthenticatedTo: '/',
  })

  return (
    <main className="p-4">
      <AuthForm mode="login" />
      <p className="mt-4 text-center text-sm">
        Don't have an account?{' '}
        <Link href="/register" className="underline">Register</Link>
      </p>
    </main>
  )
}
