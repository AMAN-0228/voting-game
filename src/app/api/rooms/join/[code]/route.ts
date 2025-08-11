import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HTTP_STATUS } from '@/constants/api-routes'
import { joinRoom } from '@/actions/rooms'
import { getIO } from '@/lib/socket-server'
import { z } from 'zod'
import { SOCKET_EVENTS } from '@/constants/api-routes'

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const resolvedParams = await context.params
  const parsed = z.object({ code: z.string().min(1) }).safeParse(resolvedParams)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid room code' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roomCode = parsed.data.code
  
  // Persist membership (idempotent)
  const result = await joinRoom('', roomCode, userId, 'code')
  if (!result.success) {
    const status = result.code === 'NOT_FOUND' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }

  const room = result.data
  const user = room.players.find((p: any) => p.id === userId) || { id: userId, name: session?.user?.name ?? null, email: session?.user?.email ?? null }

  // Emit socket event to room
  const io = getIO()
  if (io) {
    // Get the current online players for this room
    const { getOnlineList } = await import('@/lib/presence')
    const playersOnline = getOnlineList(room.id)
    
    io.to(room.id).emit(SOCKET_EVENTS.PLAYER_JOINED, {
      roomId: room.id,
      user,
      playersOnline
    })
  }

  return NextResponse.json({ room })
}