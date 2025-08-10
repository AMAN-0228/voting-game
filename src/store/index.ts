// Export all stores for easy importing
export { useGameStore } from './game-store'
export { useRoomStore } from './room-store'
export { useAuthStore } from './auth-store'
export { useWebSocketStore } from './websocket-store'

// Export types
export type { GameState, Round, Answer, Vote, Score, GamePhase } from './game-store'
export type { RoomState, Room, Player, RoomSettings } from './room-store'
export type { AuthState, User } from './auth-store'
export type { WebSocketState } from './websocket-store'

// Combined store hook for components that need multiple stores
export const useStores = () => {
  const { useGameStore } = require('./game-store')
  const { useRoomStore } = require('./room-store')
  const { useAuthStore } = require('./auth-store')
  const { useWebSocketStore } = require('./websocket-store')
  
  return {
    game: useGameStore(),
    room: useRoomStore(),
    auth: useAuthStore(),
    websocket: useWebSocketStore(),
  }
}
