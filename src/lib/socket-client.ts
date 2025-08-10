import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import { toast } from 'sonner'

// Dev-only: ensure we only trigger /api/socket once per session across HMR
let __devSocketInitTriggered = false
const devInit = {
  get(): boolean {
    if (typeof window === 'undefined') return __devSocketInitTriggered
    return !!(window as any).__DEV_SOCKET_INIT__
  },
  set(): void {
    if (typeof window === 'undefined') { __devSocketInitTriggered = true; return }
    ;(window as any).__DEV_SOCKET_INIT__ = true
  }
}

class SocketClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  private reconnectDelay(attempt: number) {
    // Exponential backoff capped at 30 seconds
    return Math.min(1000 * 2 ** attempt, 30000)
  }

  // Generic ack shape
  private ack<T = any>() {
    return (resolve: (v: { ok: boolean; data?: T; error?: string }) => void) =>
      (response: { ok: boolean; data?: T; error?: string }) => resolve(response)
  }

  // Initialize socket connection
  connect(userId: string, userEmail: string, userName?: string): Socket {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return this.socket
    }

    console.log('Connecting to Socket.IO server...')

    // Determine base URL and ensure server is initialized (dev only)
    const baseUrl = (typeof window !== 'undefined' ? window.location.origin : undefined) 
      || process.env.NEXT_PUBLIC_APP_URL 
      || 'http://localhost:3000'

    // In development, Next dev server needs a one-time init via /api/socket
    if (process.env.NODE_ENV !== 'production' && !devInit.get()) {
      try {
        void fetch(`${baseUrl}/api/socket`)
        console.log('[socket-client] Triggered /api/socket to initialize Socket.IO (dev)')
        devInit.set()
      } catch (e) {
        console.warn('[socket-client] Failed to hit /api/socket (dev init)', e)
      }
    }

    this.socket = io(baseUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      timeout: 15000,
      reconnectionAttempts: 5,
      withCredentials: true,
    })
    
    this.setupEventListeners(userId, userEmail, userName)
    
    return this.socket
  }

  private setupEventListeners(userId: string, userEmail: string, userName?: string) {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server')
      
      // Authenticate user
      this.socket?.emit('authenticate', {
        id: userId,
        email: userEmail,
        name: userName,
      })

      // Request fresh state from server
      this.socket?.emit('sync_state', {}, (res: { ok: boolean; data?: any; error?: string }) => {
        if (res?.ok && res.data) {
          try {
            // Import stores dynamically to avoid circular dependencies
            const { useWebSocketStore } = require('@/store/websocket-store')
            const { useRoomStore } = require('@/store/room-store')
            const { useGameStore } = require('@/store/game-store')
            
            const wsStore = useWebSocketStore.getState()
            const roomStore = useRoomStore.getState()
            const gameStore = useGameStore.getState()
            
            wsStore.setIsConnected(true)
            wsStore.setIsConnecting(false)
            wsStore.setConnectionError(null)
            
            if (res.data.room) roomStore.updateCurrentRoom(res.data.room)
            if (typeof res.data.isHost === 'boolean') roomStore.setIsHost(res.data.isHost)
            if (res.data.gamePhase) gameStore.setGamePhase(res.data.gamePhase)
            if (Array.isArray(res.data.scores)) gameStore.setScores(res.data.scores)
            if (Array.isArray(res.data.players)) {
              res.data.players.forEach((p: any) =>
                roomStore.addPlayer({
                  id: p.id,
                  name: p.name,
                  email: p.email,
                  isOnline: true,
                  joinedAt: new Date().toISOString(),
                })
              )
            }
          } catch (e) {
            console.warn('[socket-client] failed to apply sync_state', e)
          }
        } else if (res?.error) {
          console.warn('[socket-client] sync_state error:', res.error)
        }
      })
    })

    // On successful reconnect, re-sync state
    this.socket.on('reconnect', () => {
      this.socket?.emit('sync_state', {}, (res: { ok: boolean; data?: any; error?: string }) => {
        if (res?.ok && res.data) {
          try {
            const { useWebSocketStore } = require('@/store/websocket-store')
            const { useRoomStore } = require('@/store/room-store')
            const { useGameStore } = require('@/store/game-store')
            
            const wsStore = useWebSocketStore.getState()
            const roomStore = useRoomStore.getState()
            const gameStore = useGameStore.getState()
            
            wsStore.setIsConnected(true)
            wsStore.setIsConnecting(false)
            
            if (res.data.room) roomStore.updateCurrentRoom(res.data.room)
            if (typeof res.data.isHost === 'boolean') roomStore.setIsHost(res.data.isHost)
            if (res.data.gamePhase) gameStore.setGamePhase(res.data.gamePhase)
            if (Array.isArray(res.data.scores)) gameStore.setScores(res.data.scores)
          } catch (e) {
            console.warn('[socket-client] failed to apply sync_state after reconnect', e)
          }
        }
      })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason)
      
      // Import stores dynamically to avoid circular dependencies
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setIsConnected(false)
      gameStore.setIsConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect automatically
        wsStore.setConnectionError('Server disconnected')
        toast.error('Socket disconnected by server')
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const wsStore = useWebSocketStore.getState()
      
      wsStore.setIsConnecting(false)
      wsStore.setConnectionError(error.message)
      
      this.reconnectAttempts++
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        wsStore.setConnectionError('Failed to connect after multiple attempts')
        toast.error(`Socket error: ${error.message}`)
      } else {
        const delay = this.reconnectDelay(this.reconnectAttempts)
        setTimeout(() => {
          this.reconnectAttempts++
          this.socket?.connect()
        }, delay)
      }
    })

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('User authenticated:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const wsStore = useWebSocketStore.getState()
      wsStore.setLastEvent('authenticated', data)
    })

    // Room events
    this.socket.on(SOCKET_EVENTS.ROOM_UPDATED, (data) => {
      console.log('Room updated:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useRoomStore } = require('@/store/room-store')
      
      const wsStore = useWebSocketStore.getState()
      const roomStore = useRoomStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.ROOM_UPDATED, data)
      
      if (data.room) {
        roomStore.updateCurrentRoom(data.room)
        roomStore.setIsHost(data.room.isHost)
      }
    })

    this.socket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      console.log('Player joined:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useRoomStore } = require('@/store/room-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const roomStore = useRoomStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.PLAYER_JOINED, data)
      
      if (data.user) {
        roomStore.addPlayer({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          isOnline: true,
          joinedAt: new Date().toISOString(),
        })
      }
      
      // Update online players count
      gameStore.setPlayersOnline(
        Array.from({ length: data.playersCount }, (_, i) => `player-${i}`)
      )
    })

    this.socket.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      console.log('Player left:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useRoomStore } = require('@/store/room-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const roomStore = useRoomStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.PLAYER_LEFT, data)
      
      if (data.userId) roomStore.updatePlayerStatus(data.userId, false)
      
      // Update online players count
      gameStore.setPlayersOnline(
        Array.from({ length: data.playersCount }, (_, i) => `player-${i}`)
      )
    })

    // Game events
    this.socket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      console.log('Game started:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      const { useRoomStore } = require('@/store/room-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      const roomStore = useRoomStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.GAME_STARTED, data)
      
      gameStore.setGamePhase({ type: 'answering', timeLeft: 60, totalTime: 60 })
      roomStore.updateRoomStatus('in_progress')
    })

    this.socket.on(SOCKET_EVENTS.GAME_ENDED, (data) => {
      console.log('Game ended:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      const { useRoomStore } = require('@/store/room-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      const roomStore = useRoomStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.GAME_ENDED, data)
      
      gameStore.setGamePhase({ type: 'finished' })
      roomStore.updateRoomStatus('done')
    })

    this.socket.on(SOCKET_EVENTS.ROUND_STARTED, (data) => {
      console.log('Round started:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.ROUND_STARTED, data)
      
      if (data.round) {
        gameStore.setCurrentRound(data.round)
        gameStore.addRound(data.round)
      }
      
      gameStore.setGamePhase({ 
        type: 'answering', 
        timeLeft: data.timeLeft || 60,
        totalTime: data.timeTotal || 60 
      })
      gameStore.resetUserState()
    })

    this.socket.on(SOCKET_EVENTS.ROUND_ENDED, (data) => {
      console.log('Round ended:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.ROUND_ENDED, data)
      
      gameStore.setGamePhase({ type: 'voting', timeLeft: 30, totalTime: 30 })
    })

    // Answer events
    this.socket.on(SOCKET_EVENTS.ANSWER_SUBMITTED, (data) => {
      console.log('Answer submitted (anonymous):', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const wsStore = useWebSocketStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.ANSWER_SUBMITTED, data)
      
      // Update UI to show that someone submitted an answer
      // (answers are anonymous until voting phase)
    })

    this.socket.on('answer_confirmed', (data) => {
      console.log('Your answer was confirmed:', data)
      
      const { useGameStore } = require('@/store/game-store')
      const gameStore = useGameStore.getState()
      gameStore.setHasSubmittedAnswer(true)
    })

    this.socket.on(SOCKET_EVENTS.ANSWERING_PHASE_ENDED, (data) => {
      console.log('Answering phase ended:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.ANSWERING_PHASE_ENDED, data)
      
      gameStore.setGamePhase({ type: 'voting', timeLeft: 30, totalTime: 30 })
      
      // Load answers for voting
      if (data.answers) {
        data.answers.forEach((answer: any) => {
          gameStore.addAnswer(answer)
        })
      }
    })

    // Vote events
    this.socket.on(SOCKET_EVENTS.VOTE_SUBMITTED, (data) => {
      console.log('Vote submitted:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.VOTE_SUBMITTED, data)
      
      if (data.vote) {
        gameStore.addVote(data.vote)
      }
    })

    this.socket.on(SOCKET_EVENTS.VOTING_PHASE_ENDED, (data) => {
      console.log('Voting phase ended:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.VOTING_PHASE_ENDED, data)
      
      gameStore.setGamePhase({ type: 'results' })
    })

    // Score events
    this.socket.on(SOCKET_EVENTS.SCORES_UPDATED, (data) => {
      console.log('Scores updated:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.SCORES_UPDATED, data)
      
      if (data.scores) {
        gameStore.setScores(data.scores)
      }
    })

    // Timer events
    this.socket.on(SOCKET_EVENTS.TIMER_UPDATED, (data) => {
      let timeLeft = data.timeLeft
      if (!timeLeft && data.deadline) {
        const dl = typeof data.deadline === 'number' ? data.deadline : Date.parse(data.deadline)
        timeLeft = Math.max(0, Math.ceil((dl - Date.now()) / 1000))
      }
      
      const { useGameStore } = require('@/store/game-store')
      const gameStore = useGameStore.getState()
      
      gameStore.setGamePhase({
        ...gameStore.gamePhase,
        timeLeft: typeof timeLeft === 'number' ? timeLeft : gameStore.gamePhase.timeLeft,
      })
    })

    this.socket.on(SOCKET_EVENTS.TIMER_ENDED, (data) => {
      console.log('Timer ended:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const { useGameStore } = require('@/store/game-store')
      
      const wsStore = useWebSocketStore.getState()
      const gameStore = useGameStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.TIMER_ENDED, data)
      
      // Handle phase transition based on current phase
      const currentPhase = gameStore.gamePhase.type
      if (currentPhase === 'answering') {
        gameStore.setGamePhase({ type: 'voting', timeLeft: 30, totalTime: 30 })
      } else if (currentPhase === 'voting') {
        gameStore.setGamePhase({ type: 'results' })
      }
    })

    // Error events
    this.socket.on(SOCKET_EVENTS.ERROR, (data) => {
      console.error('Socket error:', data)
      
      const { useWebSocketStore } = require('@/store/websocket-store')
      const wsStore = useWebSocketStore.getState()
      
      wsStore.setLastEvent(SOCKET_EVENTS.ERROR, data)
      wsStore.setConnectionError(data.message)
    })
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from Socket.IO server')
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Get current socket instance
  getSocket(): Socket | null {
    return this.socket
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

// Export singleton instance
export const socketClient = new SocketClient()

// Export hook for easy use in components
export const useSocket = () => {
  return {
    getSocket: socketClient.getSocket.bind(socketClient),
    isConnected: socketClient.isConnected.bind(socketClient),
  }
}

// API + Socket join flow
export async function joinRoom(roomId: string): Promise<{ ok: boolean; error?: string }> {
  const { roomHelpers } = await import('@/lib/api-helpers')
  
  try {
    // First, call API to persist membership in database
    const apiResult = await roomHelpers.joinRoomById(roomId)
    
    if (apiResult.error) {
      return { ok: false, error: apiResult.error || 'Failed to join room' }
    }

    // Update room store with fresh data from API
    if (apiResult.data) {
      const { useRoomStore } = require('@/store/room-store')
      const roomStore = useRoomStore.getState()
      // Map API response to store format
      const roomData = {
        ...apiResult.data,
        players: apiResult.data.playerIds?.map((playerId: string) => ({
          id: playerId,
          isOnline: true,
          joinedAt: new Date().toISOString()
        })) || []
      }
      roomStore.updateCurrentRoom(roomData as any)
    }

    // Only emit socket event AFTER successful database update
    const socket = socketClient.getSocket()
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId })
    }

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Failed to join room' }
  }
}

// Emit helpers with ack and optimistic updates
export async function joinRoomWithAck(roomId: string): Promise<{ ok: boolean; error?: string }> {
  const socket = socketClient.getSocket()
  if (!socket || !socket.connected) return { ok: false, error: 'Not connected' }
  
  const { useWebSocketStore } = require('@/store/websocket-store')
  const { useRoomStore } = require('@/store/room-store')
  
  const wsStore = useWebSocketStore.getState()
  const roomStore = useRoomStore.getState()
  
  // optimistic
  const prevRoomId = wsStore.currentRoomId
  wsStore.setCurrentRoomId(roomId)
  
  return new Promise((resolve) => {
    socket.emit('join_room', { roomId }, (res: { ok: boolean; error?: string; data?: any }) => {
      if (!res?.ok) {
        // rollback
        wsStore.setCurrentRoomId(prevRoomId)
        resolve({ ok: false, error: res?.error || 'Join failed' })
        return
      }
      if (res.data?.room) roomStore.updateCurrentRoom(res.data.room as any)
      resolve({ ok: true })
    })
  })
}

export async function leaveRoomWithAck(): Promise<{ ok: boolean; error?: string }> {
  const socket = socketClient.getSocket()
  if (!socket || !socket.connected) return { ok: false, error: 'Not connected' }
  
  const { useWebSocketStore } = require('@/store/websocket-store')
  const wsStore = useWebSocketStore.getState()
  
  const prevRoomId = wsStore.currentRoomId
  if (!prevRoomId) return { ok: false, error: 'Not in a room' }
  
  // optimistic
  wsStore.setCurrentRoomId(null)
  
  return new Promise((resolve) => {
    socket.emit('leave_room', { roomId: prevRoomId }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) {
        // rollback
        wsStore.setCurrentRoomId(prevRoomId)
        resolve({ ok: false, error: res?.error || 'Leave failed' })
        return
      }
      resolve({ ok: true })
    })
  })
}

export async function submitAnswerWithAck(roundId: string, content: string): Promise<{ ok: boolean; error?: string }> {
  const socket = socketClient.getSocket()
  if (!socket || !socket.connected) return { ok: false, error: 'Not connected' }
  
  const { useGameStore } = require('@/store/game-store')
  const gameStore = useGameStore.getState()
  
  // optimistic
  const prevAnswer = (gameStore as any).userAnswer
  gameStore.setUserAnswer(content)
  
  return new Promise((resolve) => {
    socket.emit('answer_submitted', { roundId, content }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) {
        // rollback
        gameStore.setUserAnswer(prevAnswer)
        resolve({ ok: false, error: res?.error || 'Answer failed' })
        return
      }
      gameStore.setHasSubmittedAnswer(true)
      resolve({ ok: true })
    })
  })
}

export async function submitVoteWithAck(roundId: string, answerId: string): Promise<{ ok: boolean; error?: string }> {
  const socket = socketClient.getSocket()
  if (!socket || !socket.connected) return { ok: false, error: 'Not connected' }
  
  const { useGameStore } = require('@/store/game-store')
  const gameStore = useGameStore.getState()
  
  // optimistic
  const prevVoted = (gameStore as any).votedAnswerId
  gameStore.setVotedAnswerId(answerId)
  gameStore.setHasVoted(true)
  
  return new Promise((resolve) => {
    socket.emit('vote_submitted', { roundId, answerId }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) {
        // rollback
        gameStore.setVotedAnswerId(prevVoted || null)
        gameStore.setHasVoted(false)
        resolve({ ok: false, error: res?.error || 'Vote failed' })
        return
      }
      resolve({ ok: true })
    })
  })
}
