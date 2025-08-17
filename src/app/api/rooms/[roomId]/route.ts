import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HTTP_STATUS } from '@/constants/api-routes'
import { getRoom } from '@/actions/rooms'
import { z } from 'zod'

const paramsSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required')
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions)
  console.log('🔄 GET /api/rooms/[roomId] session:', session)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: HTTP_STATUS.UNAUTHORIZED })
  }

  try {
    const resolvedParams = await params
    const parsed = paramsSchema.safeParse(resolvedParams)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid room ID', code: 'VALIDATION_ERROR' }, { status: HTTP_STATUS.BAD_REQUEST })
    }

    const result = await getRoom(parsed.data.roomId)
    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR
      return NextResponse.json({ error: result.error, code: result.code }, { status })
    }

    return NextResponse.json({ room: result.data }, { status: HTTP_STATUS.OK })
  } catch (error) {
    console.error('GET /api/rooms/[roomId] error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}
