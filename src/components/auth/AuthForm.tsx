'use client'

import { useState } from 'react'
import { z } from 'zod'
import { loginSchema, registerSchema } from '@/lib/validations'
import { authHelpers } from '@/lib/api-helpers'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export type AuthMode = 'login' | 'register'

interface AuthFormProps {
  mode: AuthMode
}

const registerWithConfirmSchema = registerSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      setIsSubmitting(true)
      if (mode === 'login') {
        const parsed = loginSchema.safeParse({ email, password })
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {}
          parsed.error.errors.forEach((err) => {
            const field = (err.path?.[0] as string) || 'form'
            fieldErrors[field] = err.message
          })
          setErrors(fieldErrors)
          return
        }

        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl: '/',
        })

        if (result?.error) {
          setErrors({ form: result.error })
          toast.error(result.error)
          return
        }
        toast.success('Logged in successfully')
        router.push(result?.url || '/')
      } else {
        const parsed = registerWithConfirmSchema.safeParse({ name, email, password, confirmPassword })
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {}
          parsed.error.errors.forEach((err) => {
            const field = (err.path?.[0] as string) || 'form'
            fieldErrors[field] = err.message
          })
          setErrors(fieldErrors)
          return
        }

        const { error } = await authHelpers.register({ name: name || undefined, email, password })
        if (error) {
          setErrors({ form: error })
          toast.error(error)
          return
        }
        toast.success('Registered successfully. Please login.')
        router.push('/login')
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'login' ? 'Welcome back' : 'Create an account'
  const action = mode === 'login' ? 'Sign in' : 'Sign up'

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Input
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {errors.form && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {errors.form}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : action}
            </Button>

            <div className="text-center text-xs text-gray-500">
              <Badge variant="outline" className="mt-2">
                Mobile-first UI • ShadCN
              </Badge>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
