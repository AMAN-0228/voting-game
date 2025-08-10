import { prisma } from '@/lib/prisma'

export type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export async function joinRoom(userId: string, roomId: string): Promise<ActionResult<{ id: string }>> {
  try {
    console.log(' ______________ come in joinRoom db ______________');
    const room = await prisma.room.update({
      where: { id: roomId },
      data: { playerIds: { push: userId } },
      select: { id: true },
    })
    return { success: true, data: room }
  } catch (error) {
    console.error('joinRoom error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function leaveRoom(userId: string, roomId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { playerIds: true }
    })
    if (!room) return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { playerIds: { set: room.playerIds.filter(id => id !== userId) } },
      select: { id: true },
    })
    return { success: true, data: updatedRoom }
  } catch (error) {
    console.error('leaveRoom error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function getRoomState(roomId: string): Promise<ActionResult<any>> {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        code: true,
        status: true,
        numRounds: true,
        roundTime: true,
        hostId: true,
        playerIds: true,
        scores: { select: { userId: true, points: true } },
      },
    })
    if (!room) return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    return { success: true, data: room }
  } catch (error) {
    console.error('getRoomState error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function getRoundAnswers(roundId: string): Promise<ActionResult<Array<{ id: string; content: string }>>> {
  try {
    const answers = await prisma.answer.findMany({
      where: { roundId },
      select: { id: true, content: true },
      orderBy: { createdAt: 'asc' },
    })
    return { success: true, data: answers }
  } catch (error) {
    console.error('getRoundAnswers error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function getRoomIdForRound(roundId: string): Promise<ActionResult<{ roomId: string }>> {
  try {
    const round = await prisma.round.findUnique({ where: { id: roundId }, select: { roomId: true } })
    if (!round) return { success: false, error: 'Round not found', code: 'NOT_FOUND' }
    return { success: true, data: { roomId: round.roomId } }
  } catch (error) {
    console.error('getRoomIdForRound error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function getScoresForRoom(roomId: string): Promise<ActionResult<Array<{ userId: string; points: number }>>> {
  try {
    const scores = await prisma.score.findMany({ where: { roomId }, select: { userId: true, points: true } })
    return { success: true, data: scores }
  } catch (error) {
    console.error('getScoresForRoom error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function updateRoomStatus(
  roomId: string,
  status: 'starting' | 'in_progress' | 'done'
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const room = await prisma.room.update({ where: { id: roomId }, data: { status }, select: { id: true, status: true } })
    return { success: true, data: room }
  } catch (error) {
    console.error('updateRoomStatus error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}
