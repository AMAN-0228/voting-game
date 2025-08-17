import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createRoomSchema } from '@/lib/validations'

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export async function listUserRooms(userId: string): Promise<ActionResult> {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { hostId: userId },
          { playerIds: { has: userId } },
        ],
      },
      select: {
        id: true,
        code: true,
        status: true,
        numRounds: true,
        roundTime: true,
        hostId: true,
        playerIds: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: rooms }
  } catch (error) {
    console.error('listUserRooms error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function createRoom(hostId: string, input: z.infer<typeof createRoomSchema>): Promise<ActionResult> {
  try {
    const parsed = createRoomSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid input data', code: 'VALIDATION_ERROR', data: parsed.error.errors }
    }

    // Generate unique code (6 uppercase alnum)
    const genCode = async (): Promise<string> => {
      const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code = ''
      for (let i = 0; i < 6; i++) code += charset[Math.floor(Math.random() * charset.length)]
      const exists = await prisma.room.findUnique({ where: { code } })
      return exists ? await genCode() : code
    }

    const code = await genCode()

    const room = await prisma.room.create({
      data: {
        code,
        status: 'starting',
        numRounds: parsed.data.numRounds,
        roundTime: parsed.data.roundTime,
        hostId: hostId,
        playerIds: [hostId], // Host automatically joins the room
      },
      select: {
        id: true,
        code: true,
        status: true,
        numRounds: true,
        roundTime: true,
        hostId: true,
        playerIds: true,
        createdAt: true,
      },
    })

    return { success: true, data: room }
  } catch (error) {
    console.error('createRoom error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function sendInvite(data: {
  roomId: string
  hostId: string
  userIds: string[]
}): Promise<ActionResult> {
  const schema = z.object({
    roomId: z.string().min(1, 'Room ID is required'),
    hostId: z.string().min(1, 'Host ID is required'),
    userIds: z.array(z.string().min(1, 'User ID is required')).min(1, 'At least one user ID is required')
  })

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'Invalid input', 
      code: 'VALIDATION_ERROR',
      data: parsed.error.errors 
    }
  }

  try {
    // Verify room exists and user is the host
    const room = await prisma.room.findUnique({
      where: { id: parsed.data.roomId },
      select: { id: true, hostId: true, code: true }
    })

    if (!room) {
      return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    }

    if (room.hostId !== parsed.data.hostId) {
      return { success: false, error: 'Only the host can send invites', code: 'FORBIDDEN' }
    }

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: parsed.data.userIds } },
      select: { id: true, name: true, email: true }
    })

    if (users.length !== parsed.data.userIds.length) {
      return { success: false, error: 'Some users not found', code: 'NOT_FOUND' }
    }

    // For now, we'll return the invite data
    // In a real app, you might send emails or create invite records
    const invites = users.map(user => ({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      roomId: room.id,
      roomCode: room.code,
      inviteUrl: `/room/${room.id}?invite=true&code=${room.code}`
    }))

    return { 
      success: true, 
      data: { 
        invites,
        message: `Invites sent to ${users.length} user(s)`
      } 
    }
  } catch (error) {
    console.error('sendInvite error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function updateRoomStatus(roomId: string, status: 'starting' | 'in_progress' | 'done'): Promise<ActionResult> {
  try {
    const room = await prisma.room.update({
      where: { id: roomId },
      data: { status },
      select: { id: true, code: true, status: true },
    })
    return { success: true, data: room }
  } catch (error) {
    console.error('updateRoomStatus error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function joinRoom(roomId: string, code: string, userId: string, joinBy: 'id' | 'code'): Promise<ActionResult> {
  try {
    // First, get the current room to check if user is already in playerIds
    const whereClause = joinBy === 'id' ? { id: roomId } : { code }
    const currentRoom = await prisma.room.findUnique({
      where: whereClause,
      select: {id: true, playerIds: true }
    })
    

    if (!currentRoom) {
      return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    }
    if (currentRoom.playerIds.includes(userId)) {
      return { success: false, error: 'Already in room', code: 'ALREADY_IN_ROOM' }
    }
    // Add user to playerIds if not already present (idempotent)
    const updatedPlayerIds = [...currentRoom.playerIds, userId]

    // Update room with new playerIds
    const room = await prisma.room.update({
      where: { id: currentRoom.id },
      data: { playerIds: updatedPlayerIds },
      select: {
        id: true,
        code: true,
        status: true,
        numRounds: true,
        roundTime: true,
        hostId: true,
        playerIds: true,
      },
    })

    // Get player details separately
    const players = await prisma.user.findMany({
      where: { id: { in: room.playerIds } },
      select: { id: true, name: true, email: true }
    })

    return { 
      success: true, 
      data: { ...room, players } 
    }
  } catch (error) {
    console.error('joinRoom error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}

export async function getRoom(roomId: string): Promise<ActionResult> {
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
      },
      // include: {
      //   players: true,
      // },
    })
    
    if (!room) {
      return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    }

    // Get player details separately
    const players = await prisma.user.findMany({
      where: { id: { in: room.playerIds } },
      select: { id: true, name: true, email: true }
    })
    
    return { 
      success: true, 
      data: { ...room, players } 
    }
  } catch (error) {
    console.error('getRoom error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}
