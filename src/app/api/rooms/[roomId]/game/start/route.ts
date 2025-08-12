import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket-server'
import { startGame } from '@/actions/game-actions'

// Validate request body
const StartGameSchema = z.object({
  numRounds: z.number().min(1).max(10)
})

export async function POST(
  req: NextRequest,
  context: { params: { roomId: string } }
) {
  try {
    // Get session
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get room
    const room = await prisma.room.findUnique({
      where: { id: context.params.roomId }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Verify user is host
    if (room.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can start the game' },
        { status: 403 }
      )
    }

    // Verify room is not already in progress
    if (room.status !== 'starting') {
      return NextResponse.json(
        { error: 'Game is already in progress or finished' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const { numRounds } = StartGameSchema.parse(body)

    // Get Socket.IO instance
    const io = getIO()
    if (!io) {
      throw new Error('Socket.IO not initialized')
    }

    // Start game
    const result = await startGame(io, room.id, numRounds)

    return NextResponse.json({
      success: true,
      message: 'Game started successfully',
      rounds: result.rounds.map(r => ({
        id: r.id,
        roundNumber: r.sno,
        question: r.question
      }))
    })
  } catch (error) {
    console.error('Error starting game:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}