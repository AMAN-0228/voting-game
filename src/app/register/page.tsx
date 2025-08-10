'use client'

import Link from 'next/link'
import { AuthForm } from '@/components/auth/AuthForm'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'

export default function RegisterPage() {
  // Redirect if already authenticated
  useAuthRedirect({
    redirectIfAuthenticated: true,
    redirectIfAuthenticatedTo: '/',
  })

  return (
    <main className="p-4">
      <AuthForm mode="register" />
      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline">Login</Link>
      </p>
    </main>
  )
}
