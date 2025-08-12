'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { RoomPageHeader } from '@/components/rooms/RoomPageHeader'
import { RoomPageLoading } from '@/components/rooms/RoomPageLoading'
import { RoomNotFoundScreen } from '@/components/rooms/RoomNotFound'
import { GameRoom } from '@/components/rooms/GameRoom'
import GameInterface from '@/components/game/core/GameInterface'
import GameStartButton from '@/components/game/core/GameStartButton'
import { useRoom } from '@/hooks/useRoom'
import { useRoomStore } from '@/store/room-store'
import { useRouter } from 'next/navigation'

export default function RoomPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const roomId = params?.roomId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { currentRoom, isInRoom } = useRoomStore()
  const { joinRoomAction, fetchRoom, isLoading: isJoining } = useRoom(roomId, {
    onSuccess: () => setIsLoading(false),
    onError: (error) => {
      setError(error)
      setIsLoading(false)
    }
  })

  // Reset state when roomId changes
  useEffect(() => {
    setIsLoading(true)
    setError(null)
  }, [roomId])

  useEffect(() => {
    console.log('🔄 RoomPage useEffect triggered:', { 
      status, 
      userId: session?.user?.id, 
      isInRoom, 
      roomId 
    })
    
    // Wait for session to be ready
    if (status === 'loading') {
      console.log('⏳ Session still loading...')
      return
    }
    
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      console.log('❌ User not authenticated, redirecting to login')
      router.push('/login')
      return
    }
    
    // If session is ready, just fetch room data (don't auto-join)
    if (status === 'authenticated' && session?.user?.id) {
      console.log('✅ User authenticated, room data will be fetched via API route')
      // Don't call joinRoomAction here - user is just viewing the room
      // The room data will be fetched by the GameRoom component or API route
    }
  }, [status, session?.user?.id, roomId])

  // Fetch room data when component mounts
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !currentRoom) {
      console.log('🔄 Fetching room data from API...')
      fetchRoom()
    }
  }, [status, session?.user?.id, currentRoom, roomId])

  // Show loading while session is loading
  if (status === 'loading') {
    return <RoomPageLoading />
  }

  // Show error if room not found or access denied
  if (error) {
    return <RoomNotFoundScreen roomId={roomId} onGoHome={() => router.push('/')} />
  }

  // Show loading if room data not loaded yet
  if (!currentRoom) {
    return <RoomPageLoading />
  }
  console.log('_________ 13🔄 currentRoom', currentRoom)
  // If we have room data, show the room content regardless of loading states
  if (currentRoom) {
    const isHost = currentRoom.hostId === session?.user?.id

    return (
      <div className="min-h-screen bg-gray-50">
        <RoomPageHeader status={currentRoom.status} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Room Info & Players */}
            <div className="lg:col-span-1 space-y-6">
              <GameRoom roomId={roomId} />
            </div>

            {/* Right Column - Game Interface */}
            <div className="lg:col-span-2 space-y-6">
              {/* Join Room Button - Show when user is not in room */}
              {!isInRoom && currentRoom.status === 'starting' && (
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

              {/* Game Start Button - Only show when room is in starting status and user is host */}
              {currentRoom.status === 'starting' && isInRoom && isHost && (
                <div className="flex justify-center">
                  <GameStartButton 
                    roomId={roomId} 
                    isHost={isHost} 
                    roomStatus={currentRoom.status}
                  />
                </div>
              )}

              {/* Game Interface - Show when game is active */}
              {currentRoom.status === 'in_progress' && (
                <GameInterface 
                  roomId={roomId}
                  players={currentRoom.players || []}
                />
              )}

              {/* Waiting Message - Show when room is starting and user is not host */}
              {currentRoom.status === 'starting' && isInRoom && !isHost && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow-sm border p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Waiting for Host to Start Game
                    </h3>
                    <p className="text-gray-600">
                      The host will start the game when everyone is ready.
                    </p>
                  </div>
                </div>
              )}

              {/* Viewing Message - Show when user is just viewing the room */}
              {currentRoom.status === 'starting' && !isInRoom && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow-sm border p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Room Ready
                    </h3>
                    <p className="text-gray-600">
                      This room is ready to start. Click &quot;Join Room&quot; to participate in the game.
                    </p>
                  </div>
                </div>
              )}

              {/* Game Finished Message */}
              {currentRoom.status === 'done' && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow-sm border p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Game Finished!
                    </h3>
                    <p className="text-gray-600">
                      The game has ended. Thanks for playing!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback loading state (should rarely reach here)
  return <RoomPageLoading />
}
