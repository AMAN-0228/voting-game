import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useWebSocketStore } from '@/store/websocket-store'
import { useRoomStore, type Player } from '@/store/room-store'
import { usePersistentSocket } from './usePersistentSocket'

interface UseRoomSocketProps {
  roomId: string
  onPlayerJoin?: (userId: string) => void
  onPlayerLeave?: (userId: string) => void
  onRoomUpdate?: (players: Player[]) => void
}

export function useRoomSocket({
  roomId,
  onPlayerJoin,
  onPlayerLeave,
  onRoomUpdate
}: UseRoomSocketProps) {
  const { socket, setLastEvent } = useWebSocketStore()
  const { updateCurrentRoom, addPlayer, updatePlayerStatus, updatePlayers } = useRoomStore()

  const leaveRoom = useCallback(() => {
    if (!socket) return
    socket.emit('room:leave', { roomId })
  }, [socket, roomId])

  const handleRoomData = useCallback((data: { 
    roomId: string
    status: string
    players: Player[]
    hostId: string
  }) => {
    console.log('Room data received:', data)
    setLastEvent('roomData', data)
    
    // Update room status
    updateCurrentRoom({ status: data.status as 'starting' | 'in_progress' | 'done' })
    
    // Update players list
    updatePlayers(data.players.map(player => ({
      ...player,
      isOnline: true,
      joinedAt: player.joinedAt || new Date().toISOString()
    })))
    
    // Update host status for current user
    if (data.hostId) {
      // Note: We can't access socket.data.userId here, so we'll rely on the store
      // The host status will be updated when the room is fetched
    }
    
    onRoomUpdate?.(data.players)
  }, [setLastEvent, updateCurrentRoom, updatePlayers, onRoomUpdate])

  const handleRoomSync = useCallback((data: { 
    roomId: string
    status: string
    players: Player[]
    hostId: string
  }) => {
    console.log('Room sync received:', data)
    setLastEvent('room:sync', data)
    
    // Update room status
    updateCurrentRoom({ status: data.status as 'starting' | 'in_progress' | 'done' })
    
    // Update players list
    updatePlayers(data.players.map(player => ({
      ...player,
      isOnline: true,
      joinedAt: player.joinedAt || new Date().toISOString()
    })))
    
    // Update host status for current user
    if (data.hostId) {
      // Note: We can't access socket.data.userId here, so we'll rely on the store
      // The host status will be updated when the room is fetched
    }
    
    onRoomUpdate?.(data.players)
  }, [setLastEvent, updateCurrentRoom, updatePlayers, onRoomUpdate])

  const handlePlayerJoined = useCallback((data: { 
    roomId: string
    userId: string
    userName: string
  }) => {
    console.log('Player joined:', data)
    setLastEvent('room:join', data)
    
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
  }, [setLastEvent, addPlayer, onPlayerJoin])

  const handlePlayerLeft = useCallback((data: { 
    roomId: string
    userId: string
  }) => {
    console.log('Player left:', data)
    setLastEvent('room:leave', data)
    
    if (data.userId) {
      updatePlayerStatus(data.userId, false)
      onPlayerLeave?.(data.userId)
      toast.info('A player left the room')
    }
  }, [setLastEvent, updatePlayerStatus, onPlayerLeave])

  const handleRoomError = useCallback((data: { message: string }) => {
    toast.error(data.message)
  }, [])

  useEffect(() => {
    if (!socket || !roomId) return

    // Note: Client no longer emits room:join
    // The API handles joining and emits socket events

    // Attach listeners
    socket.on('roomData', handleRoomData)
    socket.on('room:sync', handleRoomSync)
    socket.on('room:join', handlePlayerJoined)
    socket.on('room:leave', handlePlayerLeft)
    socket.on('room:error', handleRoomError)

    // Cleanup
    return () => {
      // Note: Client no longer joins rooms via socket
      // Only leave room if needed
      socket.off('roomData', handleRoomData)
      socket.off('room:sync', handleRoomSync)
      socket.off('room:join', handlePlayerJoined)
      socket.off('room:leave', handlePlayerLeft)
      socket.off('room:error', handleRoomError)
    }
  }, [
    socket,
    roomId,
    handleRoomData,
    handleRoomSync,
    handlePlayerJoined,
    handlePlayerLeft,
    handleRoomError
  ])

  return {
    leaveRoom
  }
}