import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/actions/auth'
import { HTTP_STATUS } from '@/constants/api-routes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the action to handle business logic
    const result = await registerUser(body)
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' 
        ? HTTP_STATUS.BAD_REQUEST 
        : result.code === 'USER_EXISTS' 
        ? HTTP_STATUS.CONFLICT 
        : HTTP_STATUS.INTERNAL_SERVER_ERROR
      
      return NextResponse.json(
        { 
          error: result.error, 
          code: result.code,
          details: result.data 
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      result.data,
      { status: HTTP_STATUS.CREATED }
    )

  } catch (error) {
    console.error('Registration route error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
