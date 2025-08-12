import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await context.params

    // Check if user is a member of the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { playerIds: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!room.playerIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    // Get all rounds for this room
    const rounds = await prisma.round.findMany({
      where: { roomId },
      select: {
        id: true,
        question: true,
        sno: true,
        status: true,
        createdAt: true
      },
      orderBy: { sno: 'asc' }
    })

    return NextResponse.json({
      success: true,
      rounds
    })

  } catch (error) {
    console.error('Error fetching rounds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
