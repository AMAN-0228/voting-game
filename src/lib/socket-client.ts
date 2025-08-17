import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket-events'

export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>

// Global socket instance - only one connection for the entire app
let globalSocket: SocketClient | null = null
let connectionPromise: Promise<SocketClient> | null = null

interface SocketConfig {
  userId: string
  username: string
}

/**
 * Initialize the global socket connection
 * This creates a single, persistent connection that survives page navigation
 */
export const initSocketClient = async (config: SocketConfig): Promise<SocketClient> => {
  // If we already have a connection promise, wait for it
  if (connectionPromise) {
    return connectionPromise
  }

  // If we already have a connected socket, return it
  if (globalSocket && globalSocket.connected) {
    console.log('[SOCKET CLIENT] Using existing connection:', globalSocket.id)
    return globalSocket
  }

  // Create new connection promise
  connectionPromise = createSocketConnection(config)
  
  try {
    const socket = await connectionPromise
    globalSocket = socket
    connectionPromise = null
    return socket
  } catch (error) {
    connectionPromise = null
    throw error
  }
}

/**
 * Create a new socket connection
 */
const createSocketConnection = async (config: SocketConfig): Promise<SocketClient> => {
  const { userId, username } = config
  
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    throw new Error('Socket client can only be initialized in browser')
  }

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Universal baseURL determination - works in both dev and prod
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

  return new Promise((resolve, reject) => {
    try {
      console.log('[SOCKET CLIENT] Creating new socket connection')
      console.log('[SOCKET CLIENT] Environment:', isDevelopment ? 'development' : 'production')
      console.log('[SOCKET CLIENT] Base URL:', baseURL)
      console.log('[SOCKET CLIENT] Auth data:', { userId, username })
      
      const socket = io(baseURL, {
        // Standard Socket.IO path
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth: { userId, username },
        withCredentials: true,
        
        // Improved reconnection configuration for development
        reconnectionAttempts: isDevelopment ? 15 : 5,
        reconnectionDelay: isDevelopment ? 300 : 1000,
        reconnectionDelayMax: isDevelopment ? 1000 : 5000,
        
        // Connection settings
        autoConnect: true,
        forceNew: false,
        upgrade: true,
        rememberUpgrade: true,
        
        // Development-friendly settings
        timeout: isDevelopment ? 30000 : 20000
      })

      // Connection event handlers
      socket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('[SOCKET CLIENT] Connected with ID:', socket.id)
        console.log('[SOCKET CLIENT] Auth data:', { userId, username })
        
        // Resolve the promise once connected
        resolve(socket)
      })

      socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
        console.log('[SOCKET CLIENT] Disconnected:', reason)
        
        // Log specific disconnection reasons for debugging
        if (reason === 'io server disconnect') {
          console.log('[SOCKET CLIENT] Server initiated disconnect')
        } else if (reason === 'io client disconnect') {
          console.log('[SOCKET CLIENT] Client initiated disconnect')
        } else if (reason === 'transport close') {
          console.log('[SOCKET CLIENT] Transport closed')
        } else if (reason === 'ping timeout') {
          console.log('[SOCKET CLIENT] Ping timeout')
        }
        
        // Development mode warning
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SOCKET CLIENT] In development mode, disconnections may occur due to Fast Refresh')
          console.warn('[SOCKET CLIENT] Socket will automatically reconnect')
        }
      })

      socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error: Error) => {
        console.error('[SOCKET CLIENT] Connection error:', error.message)
        reject(error)
      })

      // Error handlers for different event categories
      socket.on(SOCKET_EVENTS.ROOM_ERROR, ({ message }: { message: string }) => {
        console.error('[SOCKET CLIENT] Room error:', message)
      })

      socket.on(SOCKET_EVENTS.GAME_ERROR, ({ message }: { message: string }) => {
        console.error('[SOCKET CLIENT] Game error:', message)
      })

      // Handle connection timeout
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'))
      }, isDevelopment ? 30000 : 20000)

      socket.on(SOCKET_EVENTS.CONNECT, () => {
        clearTimeout(timeout)
      })

    } catch (error) {
      console.error('[SOCKET CLIENT] Failed to create socket:', error)
      reject(error)
    }
  })
}

/**
 * Get the current socket client
 * Returns null if no connection exists
 */
export const getSocketClient = (): SocketClient | null => {
  return globalSocket
}

/**
 * Get or create socket client
 * This is the main function components should use
 */
export const getOrCreateSocket = async (config: SocketConfig): Promise<SocketClient> => {
  if (globalSocket && globalSocket.connected) {
    return globalSocket
  }
  
  return initSocketClient(config)
}

/**
 * Disconnect the global socket
 * Only use this when the user logs out or the app is shutting down
 */
export const disconnectSocket = () => {
  if (globalSocket) {
    console.log('[SOCKET CLIENT] Disconnecting global socket')
    globalSocket.disconnect()
    globalSocket = null
  }
  if (connectionPromise) {
    connectionPromise = null
  }
}

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return globalSocket?.connected || false
}

/**
 * Reconnect socket if disconnected
 */
export const reconnectSocket = async (config: SocketConfig): Promise<SocketClient> => {
  if (globalSocket && globalSocket.connected) {
    return globalSocket
  }
  
  // Force disconnect and recreate
  disconnectSocket()
  return initSocketClient(config)
}

// Acknowledgment-based emit functions for critical actions
export const submitAnswerWithAck = async (
  roomId: string,
  roundId: string,
  answer: string
): Promise<boolean> => {
  if (!globalSocket) return false
  try {
    await globalSocket.timeout(5000).emit('game:answer:submit', { roomId, roundId, answer })
    return true
  } catch (error) {
    console.error('Failed to submit answer:', error)
    return false
  }
}

export const submitVoteWithAck = async (
  roomId: string,
  roundId: string,
  votedForUserId: string
): Promise<boolean> => {
  if (!globalSocket) return false
  try {
    await globalSocket.timeout(5000).emit('game:vote:submit', { roomId, roundId, votedForUserId })
    return true
  } catch (error) {
    console.error('Failed to submit vote:', error)
    return false
  }
}