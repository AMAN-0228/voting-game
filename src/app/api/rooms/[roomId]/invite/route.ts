import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendInvite } from '@/actions/rooms'
import { HTTP_STATUS } from '@/constants/api-routes'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const body = await request.json()
    const { roomId } = await params

    // Call the action to handle business logic
    const result = await sendInvite({
      roomId,
      hostId: session.user.id,
      userIds: body.userIds
    })

    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' 
        ? HTTP_STATUS.BAD_REQUEST 
        : result.code === 'NOT_FOUND'
        ? HTTP_STATUS.NOT_FOUND
        : result.code === 'FORBIDDEN'
        ? HTTP_STATUS.FORBIDDEN
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

    return NextResponse.json(result.data, { status: HTTP_STATUS.OK })
  } catch (error) {
    console.error('Invite API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
