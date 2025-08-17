import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HTTP_STATUS } from '@/constants/api-routes'
import { joinRoom } from '@/actions/rooms'
import { z } from 'zod'

const ParamsSchema = z.object({
  roomId: z.string().min(1),
})

export async function POST(req: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await context.params
  const parsed = ParamsSchema.safeParse(resolvedParams)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid room id' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roomId = parsed.data.roomId

  // Persist membership (idempotent)
  const result = await joinRoom(roomId, '', userId, 'id')
  if (!result.success) {
    const status = result.code === 'NOT_FOUND' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }

  const room = result.data

  // Note: Socket events are now handled by the client after successful API response
  // The client will emit 'room:join' which will trigger the server to emit 'roomData'

  return NextResponse.json({ room })
}
