import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HTTP_STATUS } from '@/constants/api-routes'
import { startRound as startRoundAction } from '@/actions/rounds'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: HTTP_STATUS.UNAUTHORIZED })
  }

  try {
    const body = await request.json()
    const result = await startRoundAction(session.user.id, body)
    if (!result.success) {
      const status = result.code === 'VALIDATION_ERROR' ? HTTP_STATUS.BAD_REQUEST
        : result.code === 'NOT_FOUND' ? HTTP_STATUS.NOT_FOUND
        : result.code === 'FORBIDDEN' ? HTTP_STATUS.FORBIDDEN
        : HTTP_STATUS.INTERNAL_SERVER_ERROR
      return NextResponse.json({ error: result.error, code: result.code, details: result.data }, { status })
    }
    return NextResponse.json(result.data, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    console.error('POST /api/rounds/start error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}
