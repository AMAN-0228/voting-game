  "use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

// Simple client-side guard: if unauthenticated, redirect to /login
// Allows public routes like /login and /register to render.
export default function AuthGuard({ children }: Props) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    if (status === 'unauthenticated' && !isPublic) {
      router.replace('/login')
    }
  }, [status, isPublic, router])

  if (status === 'loading') return null
  if (status === 'unauthenticated' && !isPublic) return null

  return children as any
}
