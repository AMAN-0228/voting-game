import { Server as SocketIOServer, Socket } from 'socket.io'
import { validateRoom } from '@/lib/socket-validation'
import { getRoomState } from '@/actions'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket-events'

type RoomSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export function registerRoomHandlers(
  io: SocketIOServer, 
  socket: RoomSocket, 
  connectedUsers: Map<string, Set<string>>
) {
  // Join Room
  socket.on('room:join', async ({ roomId }) => {
    try {
      // Join socket room and update socket data
      console.log('[BACKEND] room:join event received for roomId:', roomId)
      console.log('[BACKEND] Socket data:', { userId: socket.data.userId, username: socket.data.username })
      
      await socket.join(roomId)
      socket.data.roomId = roomId

      // Add to presence tracking
      // if (!connectedUsers.has(roomId)) {
      //   connectedUsers.set(roomId, new Set())
      // }
      // connectedUsers.get(roomId)!.add(socket.data.userId)

      // Get room state
      const state = await getRoomState(roomId)

      // Emit join event to room to notify other players
      io.to(roomId).emit('room:join', {
        roomId,
        userId: socket.data.userId,
        userName: socket.data.username
      })

      // Emit roomData to the joining user with fresh data from DB
      socket.emit('roomData', {
        roomId,
        status: state.status,
        players: state.players,
        hostId: state.hostId
      })
    } catch (error) {
      console.log('_________ Re-1');

      socket.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to join room'
      })
    }
  })

  // Leave Room
  socket.on('room:leave', async ({ roomId }) => {
    try {
      // Leave socket room
      await socket.leave(roomId)
      socket.data.roomId = undefined

      // Remove from presence tracking
      const roomUsers = connectedUsers.get(roomId)
      if (roomUsers) {
        roomUsers.delete(socket.data.userId)
        if (roomUsers.size === 0) {
          connectedUsers.delete(roomId)
        }
      }

      // Get updated room state
      const state = await getRoomState(roomId)

      // Emit leave event to room
      io.to(roomId).emit('room:leave', {
        roomId,
        userId: socket.data.userId
      })

      // Emit room sync with fresh data from DB
      io.to(roomId).emit('room:sync', {
        roomId,
        status: state.status,
        players: state.players,
        hostId: state.hostId
      })
    } catch (error) {
      console.log('_________ Re-2');

      socket.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to leave room'
      })
    }
  })

  // Sync Room State
  socket.on('room:sync', async ({ roomId }) => {
    try {
      // Validate room membership
      await validateRoom(socket, roomId)

      // Get room state
      const state = await getRoomState(roomId)

      // Emit room update
      socket.emit('room:update', {
        roomId,
        status: state.status,
        players: state.players,
        hostId: state.hostId
      })
    } catch (error) {
      console.log('_________ Re-3');
      
      socket.emit('room:error', {
        message: error instanceof Error ? error.message : 'Failed to sync room state'
      })
    }
  })

  // Handle Disconnection
  socket.on('disconnect', async () => {
    const roomId = socket.data.roomId
    if (roomId) {
      // Remove from presence tracking
      const roomUsers = connectedUsers.get(roomId)
      if (roomUsers) {
        roomUsers.delete(socket.data.userId)
        if (roomUsers.size === 0) {
          connectedUsers.delete(roomId)
        }
      }

      // Get updated room state
      const state = await getRoomState(roomId)

      // Emit leave and update events
      io.to(roomId).emit('room:leave', {
        roomId,
        userId: socket.data.userId
      })

      io.to(roomId).emit('room:update', {
        roomId,
        status: state.status,
        players: state.players,
        hostId: state.hostId
      })
    }
  })
}
