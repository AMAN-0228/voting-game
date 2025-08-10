'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRoom } from '@/hooks/useRoom'
import { useRoomStore } from '@/store/room-store'
import { useWebSocketStore } from '@/store/websocket-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import { Users, Gamepad2, Clock, Crown, Wifi, WifiOff, Loader2, AlertCircle, Home, Play } from 'lucide-react'
import { RoomPageHeader } from '@/components/rooms/RoomPageHeader'
import { RoomPageLoading } from '@/components/rooms/RoomPageLoading'
import { RoomNotFoundScreen } from '@/components/rooms/RoomNotFound'
import { RoomCodeSection } from '@/components/rooms/RoomCodeSection'
import { HostInfoCard } from '@/components/rooms/HostInfoCard'
import { GameSettingsCard } from '@/components/rooms/GameSettingCard'
import { PlayersListCard } from '@/components/rooms/PlayerListCard'
import { ConnectionStatus } from '@/components/rooms/ConnectStatus'
import { ActionButtons } from '@/components/rooms/ActionButtons'

interface RoomPageProps {
  params: Promise<{ roomId: string }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const {
    currentRoom,
    isInRoom,
    addPlayer,
    removePlayer
  } = useRoomStore()
  
  const { 
    socket, 
    isConnected, 
    currentRoomId, 
    setCurrentRoomId, 
    isConnecting,
    joinRoom: joinRoomSocket
  } = useWebSocketStore()
  
  const [roomId, setRoomId] = useState<string>('')
  const { isLoading, error, isJoining, fetchRoom, joinRoomAction } = useRoom(roomId, { autoJoin: false })

  // Extract roomId from params
  useEffect(() => {
    params.then(({ roomId: id }) => setRoomId(id)).catch((error: unknown) => {
      console.error('Failed to extract room ID from params:', error)
      toast.error('Invalid room ID', { duration: 4000 })
    })
  }, [params])

  // Load room data on mount
  useEffect(() => {
    if (roomId && session?.user?.id && session?.user?.email) {
      void fetchRoom()
    }
  }, [roomId, session?.user?.id, session?.user?.email, fetchRoom])

  // If already in room, redirect to lobby - but only after we're sure the user is fully joined
  useEffect(() => {
    if (isInRoom && roomId && currentRoom && !isLoading) {
      // Only redirect if we have room data and we're not in the middle of loading
      router.replace(`/room/${roomId}/lobby`)
    }
  }, [isInRoom, router, roomId, currentRoom, isLoading])

  // Join room via WebSocket when connected and room data is loaded
  useEffect(() => {
    if (roomId && isConnected && socket && currentRoom && !isInRoom && !currentRoomId) {
      try {
        // Join the room via WebSocket
        joinRoomSocket(roomId)
        setCurrentRoomId(roomId)
        
        // Show connection success
        toast.success('Connected to room for real-time updates!', {
          duration: 2000,
        })
      } catch (error) {
        console.error('Failed to join room via WebSocket:', error)
        toast.error('Failed to join room for real-time updates', {
          duration: 4000,
        })
      }
    }
  }, [roomId, isConnected, socket, currentRoom, isInRoom, currentRoomId, joinRoomSocket, setCurrentRoomId])

  // Set up real-time event listeners when socket is available
  useEffect(() => {
    if (!socket || !isConnected) return

    // Set up real-time event listeners
    const handlePlayerJoined = (data: { user?: { id: string; name?: string; email: string } }) => {
      if (data.user) {
        addPlayer({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          isOnline: true,
          joinedAt: new Date().toISOString(),
        })
        
        // Show real-time notification
        toast.success(`${data.user.name || data.user.email} has joined the room!`, {
          duration: 3000,
        })
      }
    }

    const handlePlayerLeft = (data: { userId?: string }) => {
      if (data.userId) {
        removePlayer(data.userId)
        
        // Show real-time notification
        toast.info('A player has left the room', {
          duration: 3000,
        })
      }
    }

    const handleRoomUpdated = (data: { room?: unknown }) => {
      if (data.room) {
        // Room data will be updated via the store
        toast.info('Room has been updated', {
          duration: 2000,
        })
      }
    }

    // Add event listeners
    socket.on(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined)
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft)
    socket.on(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated)

    // Cleanup event listeners
    return () => {
      socket.off(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined)
      socket.off(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft)
      socket.off(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated)
    }
  }, [socket, isConnected, addPlayer, removePlayer])

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

  const canJoin = !!currentRoom && !isInRoom && isConnected && session?.user?.email

  if (!session?.user?.id || !session?.user?.email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in with a valid account to join this room</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  console.log('___________ room page', {currentRoom, isInRoom, isLoading, error, roomId});
  
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

              {error && <RoomNotFoundScreen  roomId={roomId} onGoHome={() => router.push('/')} />}
              
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

                  {/* Connection Status */}
                  <ConnectionStatus
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                  />

                  {/* Action Buttons */}
                  <ActionButtons
                    canJoin={!!canJoin}
                    isJoining={isJoining}
                    handleJoinRoom={handleJoinRoom}
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    isInRoom={isInRoom}
                    onGoLobby={() => router.push(`/room/${roomId}/lobby`)}
                  />

                  {/* Navigation to Lobby for joined users */}
                  {isInRoom && (
                    <div className="pt-6 text-center">
                      <Button 
                        onClick={() => router.push(`/room/${roomId}/lobby`)}
                        variant="outline"
                        size="lg"
                        className="w-full md:w-auto px-12 py-6 text-lg font-bold border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                      >
                        <Gamepad2 className="w-5 h-5 mr-3" />
                        Go to Lobby
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
