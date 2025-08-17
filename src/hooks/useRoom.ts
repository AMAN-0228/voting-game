import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { roomHelpers } from '@/lib/api-helpers'
import { useRoomStore, RoundSummaryData } from '@/store/room-store'
import { useSocket } from '@/hooks/socket-hooks/useSocket'

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
  // Round summary functionality
  fetchRoundSummary: () => Promise<void>
  isRoundSummaryLoading: boolean
  roundSummaryError: string | null
}

export function useRoom(roomId: string, options: UseRoomOptions = {}): UseRoomReturn {
  const { autoJoin = false, onError, onSuccess } = options
  const { data: session } = useSession()
  const { 
    setCurrentRoom, 
    setIsHost, 
    addPlayer, 
    setIsInRoom, 
    setLoading,
    isInRoom,
    setError: setStoreError,
    // Round summary state
    roundSummary,
    isRoundSummaryLoading,
    roundSummaryError,
    setRoundSummary,
    setRoundSummaryLoading,
    setRoundSummaryError
  } = useRoomStore()
  const { joinRoom } = useSocket()
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
        
        // If user is already in room, automatically join socket room
        if (isUserInRoom && session.user.id) {
          console.log('🔌 User already in room, automatically joining socket room...')
          joinRoom(roomId)
        }
        
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
  }, [roomId, session?.user?.id, onSuccess, onError, setLoading, setStoreError, setCurrentRoom, setIsHost, setIsInRoom, addPlayer, joinRoom])

  const joinRoomAction = useCallback(async () => {
    
    if (!session?.user?.id) {
      const errorMsg = 'User not authenticated'
      console.log('❌ User not authenticated')
      setError(errorMsg)
      setStoreError(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
      if (isInRoom) {
        console.log('🔄 User already in room, skipping join')
        return
      }
      console.log('🚀 Starting room join process...')
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
        
        // Emit socket events after successful join
        console.log('🔌 Emitting socket join event...')
        joinRoom(roomId)
        
        // Call success callback
        onSuccess?.()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room'
      console.log('❌ Room join failed:', errorMessage)
      setError(errorMessage)
      setStoreError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }, [isInRoom, session?.user?.id, session?.user?.name, session?.user?.email, setIsInRoom, joinRoom])

  const refetch = useCallback(async () => {
    await fetchRoom()
  }, [fetchRoom])

  // Round summary fetching
  const fetchRoundSummary = useCallback(async () => {
    try {
      setRoundSummaryLoading(true)
      setRoundSummaryError(null)

      const result = await roomHelpers.getSummary(roomId)
      if (result.data?.success) {
        setRoundSummary(result.data.rounds as RoundSummaryData[])
      } else {
        throw new Error(result.data?.error || 'Failed to fetch round summary')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch round summary'
      setRoundSummaryError(errorMessage)
    } finally {
      setRoundSummaryLoading(false)
    }
  }, [roomId, setRoundSummary, setRoundSummaryLoading, setRoundSummaryError])

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
    refetch,
    // Round summary functionality
    fetchRoundSummary,
    isRoundSummaryLoading,
    roundSummaryError
  }
}
