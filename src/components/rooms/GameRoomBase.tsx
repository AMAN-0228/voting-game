'use client'

import { useWebSocketStore } from '@/store/websocket-store'
import { useGameStore } from '@/store/game-store'
import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameInterface, PlayersList } from '@/components'
import { 
  Gamepad2, 
  Users, 
  Crown, 
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface GameRoomBaseProps {
  roomId: string
  isLoading: boolean
  error: string | null
  isJoining: boolean
  refetch: () => void
}

export const GameRoomBase = ({ 
  roomId, 
  isLoading, 
  error, 
  isJoining, 
  refetch 
}: GameRoomBaseProps) => {
  const { 
    isConnected 
  } = useWebSocketStore()
  
  const { 
    playersOnline 
  } = useGameStore()
  
  const { 
    currentRoom, 
    isHost, 
    isInRoom
  } = useRoomStore()

  // Connection status
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Connecting to Game Server</h2>
              <p className="text-gray-600 mb-4">Establishing real-time connection...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading or error state
  if (isLoading || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              {isLoading ? (
                <>
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Room</h2>
                  <p className="text-gray-600">Preparing your gaming experience...</p>
                </>
              ) : error ? (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Room</h2>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <Button 
                    onClick={refetch} 
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Joining room state
  if (isJoining || !isInRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Joining Room</h2>
              <p className="text-gray-600">Getting ready to play...</p>
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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Room Header */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      Room: {currentRoom?.code}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {currentRoom?.status?.replace('_', ' ').toUpperCase() || 'STARTING'}
                      </Badge>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                        <Users className="w-3 h-3 mr-1" />
                        {playersOnline.length} players online
                      </Badge>
                      {isHost && (
                        <Badge variant="destructive" className="bg-yellow-500 text-yellow-900 border-yellow-400">
                          <Crown className="w-3 h-3 mr-1" />
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => window.history.back()} 
                    variant="outline" 
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Room
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Game Area */}
            <div className="xl:col-span-3 space-y-6">
              <GameInterface roomId={roomId} isHost={isHost} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <PlayersList 
                players={currentRoom?.players || []} 
                onlinePlayers={playersOnline}
                hostId={currentRoom?.hostId}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
