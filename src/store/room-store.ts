import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

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
  rounds: any[]
  scores: any[]
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
  
  // Room creation/joining
  isCreatingRoom: boolean
  isJoiningRoom: boolean
  joinError: string | null
  
  // Actions
  setCurrentRoom: (room: Room | null, currentUserId: string | null) => void
  updateCurrentRoom: (updates: Partial<Room>) => void
  setUserRooms: (rooms: Room[]) => void
  addUserRoom: (room: Room) => void
  
  setIsHost: (isHost: boolean) => void
  setIsInRoom: (inRoom: boolean) => void
  
  setIsCreatingRoom: (creating: boolean) => void
  setIsJoiningRoom: (joining: boolean) => void
  setJoinError: (error: string | null) => void
  
  // Player management
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayerStatus: (playerId: string, isOnline: boolean) => void
  
  // Room status management
  updateRoomStatus: (status: Room['status']) => void
  
  // Reset functions
  leaveRoom: () => void
  resetRoomState: () => void
}

export const useRoomStore = create<RoomState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentRoom: null,
      userRooms: [],
      
      isHost: false,
      isInRoom: false,
      
      isCreatingRoom: false,
      isJoiningRoom: false,
      joinError: null,
      
      // Actions
      setCurrentRoom: (room, currentUserId) => {
        console.log('___________ setCurrentRoom', room);
        
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
      
      setIsHost: (isHost) => set({ isHost }),
      setIsInRoom: (inRoom) => set({ isInRoom: inRoom }),
      
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
      
      updateRoomStatus: (status) => set((state) => ({
        currentRoom: state.currentRoom
          ? { ...state.currentRoom, status }
          : null
      })),
      
      leaveRoom: () => set({
        currentRoom: null,
        isInRoom: false,
        isHost: false,
        joinError: null,
      }),
      
      resetRoomState: () => set({
        currentRoom: null,
        userRooms: [],
        isHost: false,
        isInRoom: false,
        isCreatingRoom: false,
        isJoiningRoom: false,
        joinError: null,
      }),
    })),
    {
      name: 'room-store',
    }
  )
)
