import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HTTP_STATUS } from '@/constants/api-routes'
import { updateRoomStatus } from '@/actions/rooms'
import { z } from 'zod'

const bodySchema = z.object({ status: z.enum(['starting', 'in_progress', 'done']) })

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: HTTP_STATUS.UNAUTHORIZED })
  }

  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input data', code: 'VALIDATION_ERROR', details: parsed.error.errors }, { status: HTTP_STATUS.BAD_REQUEST })
    }

    const { roomId } = await params
    const result = await updateRoomStatus(roomId, parsed.data.status)
    if (!result.success) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
    }
    return NextResponse.json(result.data, { status: HTTP_STATUS.OK })
  } catch (error) {
    console.error('PATCH /api/rooms/[roomId]/status error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }
}
