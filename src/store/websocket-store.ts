import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { Socket } from 'socket.io-client'

// Types for WebSocket state
export interface WebSocketState {
  // Connection state
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  
  // Room connection
  currentRoomId: string | null
  
  // Real-time events
  lastEvent: {
    type: string
    data: any
    timestamp: number
  } | null
  
  // Actions
  setSocket: (socket: Socket | null) => void
  setIsConnected: (connected: boolean) => void
  setIsConnecting: (connecting: boolean) => void
  setConnectionError: (error: string | null) => void
  
  setCurrentRoomId: (roomId: string | null) => void
  
  setLastEvent: (type: string, data: any) => void
  
  // WebSocket actions (using global socket)
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
      joinRoom: (roomId) => {
        const { socket } = get()
        if (socket && socket.connected) {
          socket.emit('join_room', { roomId })
          set({ currentRoomId: roomId })
        }
      },
      
      leaveRoom: () => {
        const { socket, currentRoomId } = get()
        if (socket && socket.connected && currentRoomId) {
          socket.emit('leave_room', { roomId: currentRoomId })
          set({ currentRoomId: null })
        }
      },
      
      // Game event emitters (using global socket)
      submitAnswer: (roundId, content) => {
        const { socket } = get()
        if (socket && socket.connected) {
          socket.emit('answer_submitted', { roundId, content })
        }
      },
      
      submitVote: (roundId, answerId) => {
        const { socket } = get()
        if (socket && socket.connected) {
          socket.emit('vote_submitted', { roundId, answerId })
        }
      },
      
      startGame: () => {
        const { socket, currentRoomId } = get()
        if (socket && socket.connected && currentRoomId) {
          socket.emit('game_started', { roomId: currentRoomId })
        }
      },
      
      endGame: () => {
        const { socket, currentRoomId } = get()
        if (socket && socket.connected && currentRoomId) {
          socket.emit('game_ended', { roomId: currentRoomId })
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
