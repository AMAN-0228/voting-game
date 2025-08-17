import { create } from 'zustand'
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket-events'
import { getOrCreateSocket, disconnectSocket as disconnectGlobalSocket } from '@/lib/socket-client'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import type { SocketClient } from '@/lib/socket-client'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

// Types for WebSocket state
export interface WebSocketState {
  // Connection state
  socket: SocketType | null
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  
  // Room connection
  currentRoomId: string | null
  
  // Real-time events
  lastEvent: {
    type: string
    data: unknown
    timestamp: number
  } | null
  
  // Actions
  setSocket: (socket: SocketType | null) => void
  setIsConnected: (connected: boolean) => void
  setIsConnecting: (connecting: boolean) => void
  setConnectionError: (error: string | null) => void
  
  setCurrentRoomId: (roomId: string | null) => void
  setLastEvent: (type: string, data: unknown) => void
  
  // WebSocket actions (using global socket)
  connect: (userId: string, username: string) => Promise<void>
  disconnect: () => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  
  // Game event emitters (using global socket)
  submitAnswer: (roundId: string, content: string) => void
  submitVote: (roundId: string, answerId: string) => void
  startGame: () => void
  endGame: () => void
  
  // Reset functions
  resetWebSocketState: () => void
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      socket: null,
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      
      currentRoomId: null,
      lastEvent: null,
      
      // Actions
      setSocket: (socket) => set({ socket }),
      setIsConnected: (connected) => set({ isConnected: connected }),
      setIsConnecting: (connecting) => set({ isConnecting: connecting }),
      setConnectionError: (error) => set({ connectionError: error }),
      
      setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
      
      setLastEvent: (type, data) => set({
        lastEvent: {
          type,
          data,
          timestamp: Date.now()
        }
      }),
      
      // WebSocket actions (using global socket)
      connect: async (userId, username) => {
        const { socket } = get()
        if (socket) {
          toast.info('Already connected to a game server.')
          return
        }

        set({ isConnecting: true })
        try {
          const newSocket = await getOrCreateSocket({ userId, username })
          set({ socket: newSocket, isConnected: true, isConnecting: false })
          toast.success('Connected to game server')
        } catch (error) {
          set({ isConnecting: false, connectionError: error instanceof Error ? error.message : 'Unknown error' })
          toast.error('Failed to connect to game server')
        }
      },

      disconnect: () => {
        const { socket } = get()
        if (socket) {
          disconnectGlobalSocket()
          set({ 
            socket: null, 
            isConnected: false,
            currentRoomId: null,
            lastEvent: null
          })
          toast.info('Disconnected from game server')
        }
      },
      
      joinRoom: (roomId) => {
        const { socket } = get()
        if (socket && socket.connected) {
          socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId })
          set({ currentRoomId: roomId })
          toast.success('Joined room')
        }
      },
      
      leaveRoom: () => {
        const { socket, currentRoomId } = get()
        if (socket && socket.connected && currentRoomId) {
          socket.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId: currentRoomId })
          set({ currentRoomId: null })
          toast.info('Left room')
        }
      },
      
      // Game event emitters (using global socket)
      submitAnswer: (roundId, content) => {
        const { socket, currentRoomId } = get()
        if (socket && socket.connected && currentRoomId) {
          socket.emit(SOCKET_EVENTS.GAME_ANSWER_SUBMIT, { 
            roomId: currentRoomId,
            roundId, 
            answer: content 
          })
        }
      },
      
      submitVote: (roundId, answerId) => {
        const { socket, currentRoomId } = get()
        if (socket && socket.connected && currentRoomId) {
          socket.emit(SOCKET_EVENTS.GAME_VOTE_SUBMIT, { 
            roomId: currentRoomId,
            roundId, 
            votedForUserId: answerId 
          })
        }
      },
      
      startGame: () => {
        const { socket, currentRoomId } = get()
        console.log('_________ 15🔄 startGame')
        if (currentRoomId && socket) {
          socket.emit(SOCKET_EVENTS.GAME_START, { roomId: currentRoomId, numRounds: 3 })
        }
      },
      
      endGame: () => {
        const { socket, currentRoomId } = get()
        if (currentRoomId && socket) {
          socket.emit(SOCKET_EVENTS.GAME_ENDED, { roomId: currentRoomId })
        }
      },
      
      resetWebSocketState: () => set({
        socket: null,
        isConnected: false,
        isConnecting: false,
        connectionError: null,
        currentRoomId: null,
        lastEvent: null,
      }),
    })),
    {
      name: 'websocket-store',
    }
  )
)