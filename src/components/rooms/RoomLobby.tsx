'use client'

import { useRoomStore } from '@/store/room-store'
import {  useRoomSocket } from '@/hooks/socket-hooks'
import { Card, CardTitle } from '../ui'
import { GameInterface, GameStartButton } from '../game'

interface RoomLobbyProps {
  roomId: string
  joinRoomAction: () => void
  isJoining: boolean
}

const LobbyContent = ({ status = 'starting', isInRoom, isHost }: { status: string, isInRoom: boolean, isHost: boolean }) => {
  const content = {
    title: '',
    description: '',
  }
  if (status === 'starting' && !isInRoom) {
    content.title = 'Room Ready'
    content.description = 'This room is ready to start. Click &quot;Join Room&quot; to participate in the game.'
  } else if (status === 'starting' && isInRoom && !isHost) {
    content.title = 'Waiting for Host to Start Game'
    content.description = 'The host will start the game when everyone is ready.'
  } else if (status === 'starting' && isInRoom && isHost) {
    content.title = 'Start the Game'
    content.description = 'Start the game when everyone is ready.'
  } else if (status === 'done') {
    content.title = 'Game Finished'
    content.description = 'The game has ended. Thanks for playing!'
  }
  return (
    <div className="text-center py-12">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {content.title}
        </h3>
        <p className="text-gray-600">
          {content.description}
        </p>
      </div>
    </div>
  )
}

export const RoomLobby = ({ roomId, joinRoomAction, isJoining }: RoomLobbyProps) => {
  // Get room data from store instead of fetching from backend
  const { currentRoom, isInRoom, isHost } = useRoomStore()
  console.log('🔄 RoomLobby: currentRoom', currentRoom)
  console.log('🔄 RoomLobby: isInRoom', isInRoom)
  // Initialize socket listeners for room when user is in the room
  useRoomSocket({ roomId, isActive: isInRoom })



  // If no room data in store, show loading
  return (
    <div className='text-center py-12'>
      <div className="bg-white rounded-lg shadow-sm border  p-8 w-full">
        <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
          <div className="text-2xl font-bold">Lobby</div>
          {currentRoom?.status === 'starting' && !isInRoom && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  console.log('🚀 User wants to join room...')
                  joinRoomAction()
                }}
                disabled={isJoining}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isJoining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          )}
          {currentRoom?.status === 'starting' && isInRoom && isHost && (
            <div className="flex justify-center">
              <GameStartButton
                roomId={roomId} 
                isHost={isHost} 
                roomStatus={currentRoom.status}
              />
            </div>
          )}
        </div>
        {/* Waiting Message - Show when room is starting and user is not host */}
        
        <LobbyContent status={currentRoom?.status} isInRoom={isInRoom} isHost={isHost} />
      </div>
    </div>
  )
}
