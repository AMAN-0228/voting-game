import { useCallback } from 'react'
import { useRoomStore } from '@/store/room-store'
import { usePersistentSocket } from './usePersistentSocket'

interface UseRoomSocketListenersProps {
  roomId: string
  isInRoom: boolean
}

/**
 * Hook for handling socket listeners when user is actually in a room
 * This separates viewing a room from being in a room
 * 
 * Flow:
 * 1. User joins room via API call
 * 2. When API call succeeds, client emits room:join
 * 3. Server receives room:join and emits roomData back
 */
export function useRoomSocketListeners({ roomId, isInRoom }: UseRoomSocketListenersProps) {
  const { socket } = usePersistentSocket()

  // Initialize all socket listeners for the room
  // useAllSocketListeners(socket, { roomId }) // This line was removed as per the edit hint

  return {
    roomId,
    isInRoom
  }
}
