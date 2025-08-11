import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRoomStore } from '@/store/room-store'
import { roomHelpers } from '@/lib/api-helpers'
import type { Room } from '@/lib/api-helpers'

interface UseRoomOptions {
  autoJoin?: boolean
  onError?: (error: string) => void
  onSuccess?: () => void
}

interface UseRoomReturn {
  isLoading: boolean
  error: string | null
  isJoining: boolean
  fetchRoom: () => Promise<void>
  joinRoomAction: () => Promise<void>
  refetch: () => Promise<void>
}

export function useRoom(roomId: string, options: UseRoomOptions = {}): UseRoomReturn {
  const { autoJoin = false, onError, onSuccess } = options
  const { data: session } = useSession()
  const { 
    setCurrentRoom, 
    setIsHost, 
    addPlayer, 
    setIsInRoom, 
    updatePlayers,
    setLoading,
    setError: setStoreError
  } = useRoomStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  const fetchRoom = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      setLoading(true)
      setError(null)
      setStoreError(null)

      const result = await roomHelpers.getRoomById(roomId)
      if (result.error) {
        throw new Error(result.error)
      }

      if (result.data?.room) {
        const room = result.data.room
        
        // Check if current user is already a player in this room
        const isUserInRoom = room.playerIds?.includes(session.user.id) || false
        
        // Update room store with fetched data
        setCurrentRoom({
          ...room,
          players: (room.players || []).map(player => ({
            ...player,
            name: player.name || undefined,
            email: player.email || undefined,
            isOnline: player.isOnline ?? true,
            joinedAt: player.joinedAt || new Date().toISOString()
          })),
          rounds: [],
          scores: []
        }, session.user.id)
        setIsHost(room.hostId === session.user.id)
        
        // Set user as in room if they're already a player
        setIsInRoom(isUserInRoom)
        
        // If user is not in room, add them to the players list for display
        if (!isUserInRoom && room.playerIds) {
          room.playerIds.forEach((playerId: string) => {
            addPlayer({
              id: playerId,
              isOnline: true, // Will be updated via socket events
              joinedAt: new Date().toISOString()
            })
          })
        }
      }

      onSuccess?.()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch room'
      setError(errorMessage)
      setStoreError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }, [roomId, session?.user?.id, onSuccess, onError, setLoading, setStoreError])

  const joinRoomAction = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated')
      setStoreError('User not authenticated')
      return
    }

    try {
      setIsJoining(true)
      setError(null)
      setStoreError(null)

      // Join room via centralized API helper (no socket calls)
      const result = await roomHelpers.joinRoomById(roomId)
      if (result.error) {
        throw new Error(result.error)
      }

      if (result.data) {
        const room = result.data
        
        // Update room store with joined room data
        setCurrentRoom({
          ...room,
          players: (room.players || []).map(player => ({
            ...player,
            name: player.name || undefined,
            email: player.email || undefined,
            isOnline: player.isOnline ?? true,
            joinedAt: player.joinedAt || new Date().toISOString()
          })),
          rounds: [],
          scores: []
        }, session.user.id)
        
        // Set user as successfully joined the room
        setIsInRoom(true)

        // Add current user to players list if not already present
        if (session.user.id && !room.players?.some(p => p.id === session.user.id)) {
          addPlayer({
            id: session.user.id,
            name: session.user.name || undefined,
            email: session.user.email || undefined,
            isOnline: true,
            joinedAt: new Date().toISOString()
          })
        }
      }

      onSuccess?.()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room'
      setError(errorMessage)
      setStoreError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }, [roomId, session?.user?.id, session?.user?.name, session?.user?.email, onSuccess, onError, setStoreError])

  const refetch = useCallback(async () => {
    await fetchRoom()
  }, [fetchRoom])

  // Auto-join if requested
  useEffect(() => {
    if (autoJoin && session?.user?.id) {
      joinRoomAction()
    }
  }, [autoJoin, session?.user?.id, joinRoomAction])

  return {
    isLoading,
    error,
    isJoining,
    fetchRoom,
    joinRoomAction,
    refetch
  }
}
