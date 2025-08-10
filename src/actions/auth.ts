import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema, type RegisterInput } from '@/lib/validations'

export interface AuthResult {
  success: boolean
  data?: any
  error?: string
  code?: string
}

/**
 * Register a new user
 * Server-side action for user registration with validation and password hashing
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  try {
    // Validate input data
    const validationResult = registerSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Invalid input data',
        code: 'VALIDATION_ERROR',
        data: validationResult.error.errors
      }
    }

    const { email, password, name } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      }
    }

    // Hash password with bcrypt (salt rounds >= 10 as per security requirements)
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    return {
      success: true,
      data: {
        message: 'User registered successfully',
        user: newUser
      }
    }

  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  }
}

/**
 * Authenticate user credentials
 * Used by NextAuth CredentialsProvider
 */
export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  }
}
