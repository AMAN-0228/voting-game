'use client'

import { useEffect, useCallback, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, Gamepad2 } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { useRoomStore } from '@/store/room-store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { RoomPageHeader } from '@/components/rooms/RoomPageHeader'
import { RoomPageLoading } from '@/components/rooms/RoomPageLoading'
import { RoomNotFoundScreen } from '@/components/rooms/RoomNotFound'
import { RoomCodeSection } from '@/components/rooms/RoomCodeSection'
import { HostInfoCard } from '@/components/rooms/HostInfoCard'
import { GameSettingsCard } from '@/components/rooms/GameSettingCard'
import { PlayersListCard } from '@/components/rooms/PlayerListCard'
import { ActionButtons } from '@/components/rooms/ActionButtons'

interface RoomPageProps {
  params: Promise<{ roomId: string }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [roomId, setRoomId] = useState('')

  useEffect(() => {
    params.then(p => setRoomId(p.roomId))
  }, [params])

  const { 
    isLoading, 
    error,
    fetchRoom, 
    joinRoomAction 
  } = useRoom(roomId, { autoJoin: false })

  const { 
    currentRoom, 
    isInRoom 
  } = useRoomStore()

  const { isConnected } = useWebSocket()

  // Load room data on mount
  useEffect(() => {
    
    if (roomId && session?.user?.id && session?.user?.email) {
      void fetchRoom()
    }
  }, [roomId, session?.user?.id, session?.user?.email, fetchRoom])

  // If already in room, redirect to lobby
  useEffect(() => {
    if (isInRoom && roomId && currentRoom && !isLoading) {
      router.replace(`/room/${roomId}/lobby`)
    }
  }, [isInRoom, router, roomId, currentRoom, isLoading])

  // Check if current user is already a player in this room
  const isCurrentUserInRoom = useMemo(() => {
    return isInRoom
  }, [currentRoom, session?.user?.id])

  const handleJoinRoom = useCallback(async () => {
    if (!roomId || !session?.user?.id || !session?.user?.email) {
      toast.error('User information is incomplete', {
        duration: 4000,
      })
      return
    }

    try {
      await joinRoomAction()
      
      // Show success message
      toast.success('Successfully joined the room!', {
        duration: 2000,
      })
      
      // Navigate to lobby
      router.push(`/room/${roomId}/lobby`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room'
      toast.error(errorMessage, {
        duration: 4000,
      })
    }
  }, [roomId, session?.user?.id, session?.user?.email, joinRoomAction, router])

  const handleGoToLobby = useCallback(() => {
    if (roomId) {
      router.push(`/room/${roomId}/lobby`)
    }
  }, [roomId, router])

  const canJoin = !!currentRoom && !isInRoom && isConnected && !!session?.user?.email

  if (!session?.user?.id || !session?.user?.email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in with a valid account to join this room</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:60px_60px] opacity-40"></div>
      
      <main className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Game Room
            </h1>
            <p className="text-purple-200 text-lg">Join the ultimate voting experience</p>
          </div>

          {/* Main Card */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
            <RoomPageHeader status={currentRoom?.status} />
            
            <CardContent className="p-8">
              {isLoading && <RoomPageLoading />}

              {error && <RoomNotFoundScreen roomId={roomId} onGoHome={() => router.push('/')} />}
              
              {!isLoading && !error && !currentRoom && roomId && (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Room Not Found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    The room you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
                  </p>
                  <Button onClick={() => router.push('/')} variant="outline" size="lg" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              )}

              {!isLoading && !error && currentRoom && roomId && (
                <div className="space-y-8">
                  {/* Room Code Section */}
                  <RoomCodeSection code={currentRoom.code} />

                  {/* Room Info Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Host Info */}
                      <HostInfoCard 
                        name={currentRoom.host?.name}
                        email={currentRoom.host?.email}
                      />

                      {/* Game Settings */}
                      <GameSettingsCard 
                        numRounds={currentRoom.numRounds}
                        roundTime={currentRoom.roundTime}
                      />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Players List */}
                      <PlayersListCard
                        players={currentRoom.players}
                        hostId={currentRoom.hostId}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {isCurrentUserInRoom ? (
                        // User is already in room - show "Go to Lobby" button
                        <Button 
                          onClick={handleGoToLobby}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                          size="lg"
                        >
                          <Gamepad2 className="w-5 h-5 mr-2" />
                          Go to Lobby
                        </Button>
                      ) : (
                        // User is not in room - show "Join Room" button
                        <ActionButtons 
                          canJoin={canJoin}
                          isJoining={false}
                          handleJoinRoom={handleJoinRoom}
                          isConnected={isConnected}
                          isConnecting={false}
                          isInRoom={isInRoom}
                          onGoLobby={handleGoToLobby}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
