'use client'

import { useRoomStore } from '@/store/room-store'
import { useRoomSocketListeners } from '@/hooks/socket-hooks'
import { GameRoomBase } from './GameRoomBase'

interface RoomLobbyProps {
  roomId: string
}

export const RoomLobby = ({ roomId }: RoomLobbyProps) => {
  // Get room data from store instead of fetching from backend
  const { currentRoom, isInRoom } = useRoomStore()
  
  // Initialize socket listeners for room when user is in the room
  useRoomSocketListeners({ roomId, isInRoom })

  // If no room data in store, show loading
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Room Data</h2>
          <p className="text-purple-200">Getting room information from memory...</p>
        </div>
      </div>
    )
  }

  return (
    <GameRoomBase
      roomId={roomId}
      isLoading={false} // No loading state in lobby
      error={null} // No error state in lobby
      isJoining={false} // No joining state in lobby
      refetch={() => {}} // No refetch needed in lobby
    />
  )
}
