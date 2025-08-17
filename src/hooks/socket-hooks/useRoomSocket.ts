import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useRoomStore, type Player } from '@/store/room-store'
import { useSocket } from './useSocket'
import { SOCKET_EVENTS } from '@/constants/api-routes'

interface UseRoomSocketProps {
  roomId: string
  isActive: boolean // true = user is in room, false = just viewing
  onPlayerJoin?: (userId: string) => void
  onPlayerLeave?: (userId: string) => void
  onRoomUpdate?: (players: Player[]) => void
}

export function useRoomSocket({
  roomId,
  isActive,
  onPlayerJoin,
  onPlayerLeave,
  onRoomUpdate
}: UseRoomSocketProps) {
  const { socket, joinRoom, leaveRoom } = useSocket()
  const { updateCurrentRoom, addPlayer, updatePlayerStatus, updatePlayers, updateRoomStatus } = useRoomStore()

  const handleRoomData = useCallback((data: { 
    roomId: string
    status: string
    players: Player[]
    hostId: string
  }) => {
    console.log('Room data received:', data)
    
    // Update room status
    updateCurrentRoom({ status: data.status as 'starting' | 'in_progress' | 'done' })
    
    // Update players list
    updatePlayers(data.players.map(player => ({
      ...player,
      isOnline: true,
      joinedAt: player.joinedAt || new Date().toISOString()
    })))
    
    onRoomUpdate?.(data.players)
  }, [updateCurrentRoom, updatePlayers, onRoomUpdate])

  const handleRoomSync = useCallback((data: { 
    roomId: string
    status: string
    players: Player[]
    hostId: string
  }) => {
    console.log('Room sync received:', data)
    
    // Update room status
    updateCurrentRoom({ status: data.status as 'starting' | 'in_progress' | 'done' })
    
    // Update players list
    updatePlayers(data.players.map(player => ({
      ...player,
      isOnline: true,
      joinedAt: player.joinedAt || new Date().toISOString()
    })))
    
    onRoomUpdate?.(data.players)
  }, [updateCurrentRoom, updatePlayers, onRoomUpdate])

  const handlePlayerJoined = useCallback((data: { 
    roomId: string
    userId: string
    userName: string
  }) => {
    console.log('Player joined:', data)
    
    if (data.userId) {
      // Add the new player to the room store
      addPlayer({
        id: data.userId,
        name: data.userName,
        isOnline: true,
        joinedAt: new Date().toISOString()
      })
      
      onPlayerJoin?.(data.userId)
      toast.success(`${data.userName} joined the room`)
    }
  }, [addPlayer, onPlayerJoin])

  const handlePlayerLeft = useCallback((data: { 
    roomId: string
    userId: string
  }) => {
    console.log('Player left:', data)
    
    if (data.userId) {
      updatePlayerStatus(data.userId, false)
      onPlayerLeave?.(data.userId)
      toast.info('A player left the room')
    }
  }, [updatePlayerStatus, onPlayerLeave])

  const handleRoomStatusUpdate = useCallback((data: { status: string }) => {
    console.log('Room status updated:', data)
    updateRoomStatus(data.status as 'starting' | 'in_progress' | 'done')
  }, [updateRoomStatus])

  const handleRoomError = useCallback((data: { message: string }) => {
    toast.error(data.message)
  }, [])

  useEffect(() => {
    if (!socket || !roomId) return

    console.log('🎯 [useRoomSocket] Setting up listeners for room:', roomId, 'isActive:', isActive)

    // If user is active in room, join the socket room
    if (isActive) {
      console.log('🎯 [useRoomSocket] User is active, joining socket room:', roomId)
      joinRoom(roomId)
    }

    // Attach listeners
    socket.on(SOCKET_EVENTS.ROOM_DATA, handleRoomData)
    socket.on(SOCKET_EVENTS.ROOM_SYNC, handleRoomSync)
    socket.on(SOCKET_EVENTS.ROOM_JOIN, handlePlayerJoined)
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, handlePlayerLeft)
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError)
    socket.on(SOCKET_EVENTS.ROOM_STATUS_UPDATE, handleRoomStatusUpdate)

    // Cleanup
    return () => {
      console.log('🎯 [useRoomSocket] Cleaning up listeners for room:', roomId)
      socket.off(SOCKET_EVENTS.ROOM_DATA, handleRoomData)
      socket.off(SOCKET_EVENTS.ROOM_SYNC, handleRoomSync)
      socket.off(SOCKET_EVENTS.ROOM_JOIN, handlePlayerJoined)
      socket.off(SOCKET_EVENTS.ROOM_LEAVE, handlePlayerLeft)
      socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError)
      socket.off(SOCKET_EVENTS.ROOM_STATUS_UPDATE, handleRoomStatusUpdate)
    }
  }, [
    socket,
    roomId,
    isActive,
    joinRoom,
    handleRoomData,
    handleRoomSync,
    handlePlayerJoined,
    handlePlayerLeft,
    handleRoomError,
    handleRoomStatusUpdate
  ])

  return {
    leaveRoom: () => leaveRoom(roomId)
  }
}