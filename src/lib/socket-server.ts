import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { timerManager } from './timer-manager'
import { registerRoomHandlers } from '@/handlers/socket/roomHandlers'
import { registerGameHandlers } from '@/handlers/socket/gameHandlers'
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@/types/socket-events'

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null

// In-memory presence tracking per room
const connectedUsers = new Map<string, Set<string>>() // roomId -> Set<userId>

export function initSocketServer(server?: HTTPServer) {
  console.log('_____ initSocketServer');
  
  if (io) return io

  if (!server) {
    throw new Error('HTTP server instance is required for Socket.IO initialization')
  }

  // Universal configuration - same for dev and prod
  const isProduction = process.env.NODE_ENV === 'production'
  
  // CORS origins - allow configured origins or default
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  
  // Add NEXT_PUBLIC_APP_URL if set
  if (process.env.NEXT_PUBLIC_APP_URL && !allowedOrigins.includes(process.env.NEXT_PUBLIC_APP_URL)) {
    allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL)
  }

  io = new SocketIOServer(server, {
    // Standard Socket.IO path - same for dev and prod
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    
    // Universal settings
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: false,
    serveClient: false
  })
  // console.log('_____ io', io);

  // Authentication middleware using auth object
  io.use(async (socket, next) => {
    const { userId, username } = socket.handshake.auth

    if (!userId || !username) {
      return next(new Error('Authentication required: userId and username must be provided'))
    }

    // Store auth data in socket
    socket.data.userId = userId
    socket.data.username = username
    next()
  })

  io.on('connection', (socket) => {
    console.log(`[SOCKET SERVER] Socket connected: ${socket.id} (${socket.data.username})`)
    console.log(`[SOCKET SERVER] Socket data:`, { userId: socket.data.userId, username: socket.data.username })

    // Register modular event handlers
    if (io) {
      console.log('[SOCKET SERVER] Registering handlers for socket:', socket.id)
      registerRoomHandlers(io, socket, connectedUsers)
      registerGameHandlers(io, socket)
    }

    // Handle disconnection with presence cleanup
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId
      const userId = socket.data.userId

      if (roomId && userId) {
        // Remove from presence tracking
        const roomUsers = connectedUsers.get(roomId)
        if (roomUsers) {
          roomUsers.delete(userId)
          if (roomUsers.size === 0) {
            connectedUsers.delete(roomId)
          }
        }

        // Notify room of user leaving
        socket.to(roomId).emit('room:leave', {
          roomId,
          userId
        })
      }

      if (!isProduction) {
        console.log(`Socket disconnected: ${socket.id} (${socket.data.username})`)
      }
    })
  })

  // Initialize timer manager with socket server
  timerManager.setIO(io)

  return io
}

/**
 * Get the Socket.IO server instance
 */
export function getSocketServer() {
  if (!io) {
    throw new Error('Socket.IO server not initialized')
  }
  return io
}

export function getIO() {
  return getSocketServer()
}