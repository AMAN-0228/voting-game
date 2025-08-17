import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HTTP_STATUS } from '@/constants/api-routes'
import { joinRoom } from '@/actions/rooms'
import { z } from 'zod'

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


  return NextResponse.json({ room })
}