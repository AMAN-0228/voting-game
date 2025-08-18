import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

// Types for round summary
export interface RoundSummaryData {
  id: string
  sno: number
  question: string
  status: string
  createdAt: Date
  answers: Array<{
    id: string
    content: string
    userId: string
    userName: string
    voteCount: number
    voters: Array<{
      id: string
      name: string
    }>
  }>
  winningAnswer: {
    id: string
    content: string
    userId: string
    userName: string
    voteCount: number
    voters: Array<{
      id: string
      name: string
    }>
  } | null
  winningAnswerIds: string[] | []
  userVote: {
    answerId: string
    answerContent: string
    votedForUser: string
  } | null
  totalVotes: number
}

// Types for room state
export interface Room {
  id: string
  code: string
  status: 'starting' | 'in_progress' | 'done'
  numRounds: number
  roundTime: number
  createdAt: string
  hostId: string
  host: {
    id: string
    name?: string
    email: string
  }
  players: Player[]
  rounds: unknown[]
  scores: unknown[]
}

export interface Player {
  id: string
  name?: string
  email?: string
  isOnline: boolean
  joinedAt: string
}

export interface RoomSettings {
  numRounds: number
  roundTime: number
}

export interface RoomState {
  // Current room data
  currentRoom: Room | null
  userRooms: Room[]
  // Room management
  isHost: boolean
  isInRoom: boolean
  
  // Room loading states
  isLoading: boolean
  error: string | null
  
  // Room creation/joining
  isCreatingRoom: boolean
  isJoiningRoom: boolean
  joinError: string | null
  
  // Round summary data
  roundSummary: RoundSummaryData[] | null
  isRoundSummaryLoading: boolean
  roundSummaryError: string | null
  
  // Actions
  setCurrentRoom: (room: Room | null, currentUserId: string | null) => void
  updateCurrentRoom: (updates: Partial<Room>) => void
  setUserRooms: (rooms: Room[]) => void
  addUserRoom: (room: Room) => void
  
  setIsHost: (isHost: boolean) => void
  setIsInRoom: (inRoom: boolean) => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  setIsCreatingRoom: (creating: boolean) => void
  setIsJoiningRoom: (joining: boolean) => void
  setJoinError: (error: string | null) => void
  
  // Player management
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayerStatus: (playerId: string, isOnline: boolean) => void
  updatePlayers: (players: Player[]) => void
  
  // Room status management
  updateRoomStatus: (status: Room['status']) => void
  
  // Round summary actions
  fetchRoundSummary: (roomId: string) => Promise<void>
  setRoundSummary: (summary: RoundSummaryData[] | null) => void
  setRoundSummaryLoading: (loading: boolean) => void
  setRoundSummaryError: (error: string | null) => void
  
  // Reset functions
  leaveRoom: () => void
  resetRoomState: () => void
}

export const useRoomStore = create<RoomState>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial state
      currentRoom: null,
      userRooms: [],
      status: 'starting',
      players: [],
      isHost: false,
      isInRoom: false,
      
      isLoading: false,
      error: null,
      
      isCreatingRoom: false,
      isJoiningRoom: false,
      joinError: null,
      
      // Round summary initial state
      roundSummary: null,
      isRoundSummaryLoading: false,
      roundSummaryError: null,
      
      // Actions
      setCurrentRoom: (room, currentUserId) => {
        // console.log('___________ setCurrentRoom', { room, currentUserId, isInRoom: !!room, isHost: room ? room.hostId === currentUserId : false });
        set({ 
          currentRoom: room,
          isInRoom: !!room,
          isHost: room ? room.hostId === currentUserId : false
        })
      },
      
      updateCurrentRoom: (updates) => set((state) => ({
        currentRoom: state.currentRoom 
          ? { ...state.currentRoom, ...updates }
          : null
      })),
      
      setUserRooms: (rooms) => set({ userRooms: rooms }),
      
      addUserRoom: (room) => set((state) => ({
        userRooms: [...state.userRooms, room]
      })),
      
      setIsHost: (isHost) => {
        // console.log('___________ setIsHost', isHost);
        set({ isHost })
      },
      
      setIsInRoom: (inRoom) => {
        // console.log('___________ setIsInRoom', inRoom);
        set({ isInRoom: inRoom })
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      setIsCreatingRoom: (creating) => set({ isCreatingRoom: creating }),
      setIsJoiningRoom: (joining) => set({ isJoiningRoom: joining }),
      setJoinError: (error) => set({ joinError: error }),
      // Player management
      addPlayer: (player) => set((state) => {
        if (!state.currentRoom) return state
        const exists = state.currentRoom.players.find(p => p.id === player.id)
        const players = exists
          ? state.currentRoom.players.map(p => p.id === player.id ? { ...p, ...player, isOnline: true } : p)
          : [...state.currentRoom.players, { ...player, isOnline: player.isOnline ?? true }]
        return { currentRoom: { ...state.currentRoom, players } }
      }),
      
      removePlayer: (playerId) => set((state) => {
        if (!state.currentRoom) return state
        
        const updatedRoom = {
          ...state.currentRoom,
          players: state.currentRoom.players.filter(p => p.id !== playerId)
        }
        
        return { currentRoom: updatedRoom }
      }),
      
      updatePlayerStatus: (playerId, isOnline) => set((state) => {
        if (!state.currentRoom) return state
        
        const updatedRoom = {
          ...state.currentRoom,
          players: state.currentRoom.players.map(player =>
            player.id === playerId
              ? { ...player, isOnline }
              : player
          )
        }
        
        return { currentRoom: updatedRoom }
      }),
      
      updatePlayers: (players: Player[]) => set((state) => ({
        currentRoom: state.currentRoom
          ? { ...state.currentRoom, players }
          : null
      })),
      
      updateRoomStatus: (status) => {
        // console.log('🔄 Room store: updateRoomStatus called with status:', status)
        set((state) => ({
          currentRoom: state.currentRoom
            ? { ...state.currentRoom, status }
            : null
        }))
      },
      
      // Round summary actions
      fetchRoundSummary: async (roomId: string) => {
        set({ isRoundSummaryLoading: true, roundSummaryError: null })
        try {
          const result = await roundSummaryHelpers.getRoundSummary(roomId)
          if (result.data?.success) {
            set({ roundSummary: result.data.rounds as RoundSummaryData[], isRoundSummaryLoading: false })
          } else {
            throw new Error(result.data?.error || 'Failed to fetch round summary')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch round summary'
          set({ 
            roundSummaryError: errorMessage, 
            isRoundSummaryLoading: false 
          })
        }
      },
      
      setRoundSummary: (summary) => set({ roundSummary: summary }),
      setRoundSummaryLoading: (loading) => set({ isRoundSummaryLoading: loading }),
      setRoundSummaryError: (error) => set({ roundSummaryError: error }),
      
      leaveRoom: () => set({
        currentRoom: null,
        isInRoom: false,
        isHost: false,
        joinError: null,
        roundSummary: null,
        isRoundSummaryLoading: false,
        roundSummaryError: null,
      }),
      
      resetRoomState: () => set({
        currentRoom: null,
        userRooms: [],
        isHost: false,
        isInRoom: false,
        isCreatingRoom: false,
        isJoiningRoom: false,
        joinError: null,
        roundSummary: null,
        isRoundSummaryLoading: false,
        roundSummaryError: null,
      }),
    })),
    {
      name: 'room-store',
    }
  )
)
