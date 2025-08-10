import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRoomStore } from '@/store/room-store'
import { joinRoom } from '@/lib/socket-client'
import { roomHelpers } from '@/lib/api-helpers'
import type { RoomApiResponse } from '@/lib/api-helpers'

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
  const { updateCurrentRoom, setIsInRoom, setCurrentRoom, isInRoom } = useRoomStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoom = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await roomHelpers.getRoomById(roomId)
      console.log('Room fetch result:', result)
      if (result.error) {
        throw new Error(result.error || 'Failed to fetch room')
      }

      if (result.data?.room) {
        console.log('Room data found:', result.data.room)
        // Map basic room data to store format (players will be updated via socket events)
        const roomData = {
          ...result.data.room,
          players: result.data.room.playerIds?.map((playerId: string) => ({
            id: playerId,
            isOnline: true,
            joinedAt: new Date().toISOString()
          })) || []
        }
        console.log('Mapped room data:', roomData)
        setCurrentRoom(roomData, session?.user?.id)
        onSuccess?.()
      } else {
        console.log('No room data in result:', result)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch room'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [roomId, session?.user?.id, setCurrentRoom , onSuccess, onError])

  const joinRoomAction = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setIsJoining(true)
      setError(null)

      const result = await joinRoom(roomId)
      if (!result.ok) {
        throw new Error(result.error || 'Failed to join room')
      }

      setIsInRoom(true)
      onSuccess?.()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to join room'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }, [roomId, session?.user?.id, setIsInRoom, onSuccess, onError])

  const refetch = useCallback(async () => {
    await fetchRoom()
    if (autoJoin && !isInRoom) {
      await joinRoomAction()
    }
  }, [fetchRoom, joinRoomAction, autoJoin, isInRoom])

  // Auto-fetch on mount and when dependencies change
  // useEffect(() => {
  //   if (roomId && session?.user?.id) {
  //     fetchRoom().then(() => {
  //       if (autoJoin && !isInRoom) {
  //         joinRoomAction()
  //       }
  //     })
  //   }
  // }, [roomId, session?.user?.id, fetchRoom, autoJoin, isInRoom, joinRoomAction])

  return {
    isLoading,
    error,
    isJoining,
    fetchRoom,
    joinRoomAction,
    refetch
  }
}
