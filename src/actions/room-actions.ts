import { prisma } from '@/lib/prisma'
import { presenceManager } from '@/lib/presence'
import type { RoomStatus } from '@/types/socket-events'

interface RoomState {
  status: RoomStatus
  players: Array<{
    id: string
    name: string | null
    email: string | null
    isOnline: boolean
  }>
  hostId: string
}

/**
 * Get current room state including online players
 */
export async function getRoomState(roomId: string): Promise<RoomState> {
  // Get room from DB
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  })

  if (!room) {
    throw new Error('Room not found')
  }

  // Get online players
  const onlinePlayers = await presenceManager.getRoomUsers(roomId)
  const onlineIds = new Set(onlinePlayers.map(p => p.userId))

  // Get player details from playerIds
  const players = await prisma.user.findMany({
    where: { id: { in: room.playerIds } },
    select: { id: true, name: true, email: true }
  })

  return {
    status: room.status as RoomStatus,
    players: players.map(player => ({
      ...player,
      isOnline: onlineIds.has(player.id)
    })),
    hostId: room.hostId
  }
}

/**
 * Create a new room
 */
export async function createRoom(hostId: string) {
  return prisma.room.create({
    data: {
      hostId,
      status: 'starting',
      playerIds: [hostId],
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      numRounds: 3,
      roundTime: 60
    }
  })
}

/**
 * Add player to room
 */
export async function joinRoom(roomId: string, userId: string) {
  // Check if room exists and is joinable
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  })

  if (!room) {
    throw new Error('Room not found')
  }

  if (room.status !== 'starting') {
    throw new Error('Room is not accepting new players')
  }

  // Add player to room
  await prisma.room.update({
    where: { id: roomId },
    data: {
      playerIds: {
        push: userId
      }
    }
  })

  return room
}

/**
 * Remove player from room
 */
// export async function leaveRoom(roomId: string, userId: string) {
//   // Check if room exists
//   const room = await prisma.room.findUnique({
//     where: { id: roomId }
//   })

//   if (!room) {
//     throw new Error('Room not found')
//   }

//   // Remove player from room
//   await prisma.room.update({
//     where: { id: roomId },
//     data: {
//       players: {
//         disconnect: { id: userId }
//       }
//     }
//   })

//   // If host left, assign new host or delete room
//   if (room.hostId === userId) {
//     const remainingPlayers = await prisma.room.findUnique({
//       where: { id: roomId },
//       include: {
//         players: true
//       }
//     })

//     if (remainingPlayers?.players.length === 0) {
//       // Delete empty room
//       await prisma.room.delete({
//         where: { id: roomId }
//       })
//     } else {
//       // Assign new host
//       await prisma.room.update({
//         where: { id: roomId },
//         data: {
//           hostId: remainingPlayers!.players[0].id
//         }
//       })
//     }
//   }
// }

/**
 * Update room settings
//  */
// export async function updateRoomSettings(roomId: string, hostId: string, settings: any) {
//   const room = await prisma.room.findUnique({
//     where: { id: roomId }
//   })

//   if (!room) {
//     throw new Error('Room not found')
//   }

//   if (room.hostId !== hostId) {
//     throw new Error('Only host can update settings')
//   }

//   return prisma.room.update({
//     where: { id: roomId },
//     data: { settings }
//   })
// }