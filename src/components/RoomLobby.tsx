'use client'

import { useRoom } from '@/hooks/useRoom'
import { GameRoomBase } from './GameRoomBase'

interface RoomLobbyProps {
  roomId: string
}

export const RoomLobby = ({ roomId }: RoomLobbyProps) => {
  // Use the reusable room hook for fetching and joining
  const { 
    isLoading, 
    error, 
    isJoining, 
    refetch 
  } = useRoom(roomId, { 
    autoJoin: true,
    onError: (err) => console.error('Room error:', err)
  })

  return (
    <GameRoomBase
      roomId={roomId}
      isLoading={isLoading}
      error={error}
      isJoining={isJoining}
      refetch={refetch}
    />
  )
}
