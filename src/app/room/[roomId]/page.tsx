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
import { RoundSummary } from '@/components/game'
import { useRoom } from '@/hooks/useRoom'
import { useRoomStore } from '@/store/room-store'
import { useRouter } from 'next/navigation'
import { CardTitle, CardHeader, Card, CardContent, RoomLobby, RoomSidebar } from '@/components'

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
  if (status === 'loading' || !currentRoom) {
    return <RoomPageLoading />
  }

  // Show error if room not found or access denied
  if (error) {
    return <RoomNotFoundScreen roomId={roomId} onGoHome={() => router.push('/')} />
  }

 
  console.log('_________ 13🔄 currentRoom', currentRoom)
  // If we have room data, show the room content regardless of loading states
  if (currentRoom) {
    const isHost = currentRoom.hostId === session?.user?.id

    console.log('🔄 RoomPage: Rendering with status:', currentRoom.status, 'isInRoom:', isInRoom, 'isHost:', isHost)

    return (
      <div className="min-h-screen bg-gray-50">
        <RoomPageHeader status={currentRoom.status} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Room Info & Players */}
            <RoomSidebar code={currentRoom.code} players={currentRoom.players} hostId={currentRoom.hostId} />
            {/* Right Column - Game Interface */}
            <div className="lg:col-span-2 space-y-6">
              {/* Join Room Button - Show when user is not in room */}


              {/* Game Start Button - Only show when room is in starting status and user is host */}
              {currentRoom.status === 'starting' && (
                <RoomLobby roomId={roomId} joinRoomAction={joinRoomAction} isJoining={isJoining} />
              )}

              {/* Game Interface - Show when game is active */}
              {currentRoom?.status === 'in_progress' && (
                <GameInterface 
                  roomId={roomId}
                  players={currentRoom.players || []}
                />
              )}
              {/* Game Finished */}
              {currentRoom.status === 'done' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Game Finished!</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center text-lg">Congratulations! The game has ended.</p>
                    </CardContent>
                  </Card>
                  
                  {/* Round Summary */}
                  <RoundSummary roomId={roomId} />
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
