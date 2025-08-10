'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRoom } from '@/hooks/useRoom'
import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Users, Crown, Clock, Settings, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface RoomEntryProps {
  roomId: string
}

export const RoomEntry = ({ roomId }: RoomEntryProps) => {
  const router = useRouter()
  const { currentRoom, isInRoom } = useRoomStore()
  const { isLoading, error, isJoining, fetchRoom, joinRoomAction } = useRoom(roomId, { autoJoin: false })

  // Load room data on mount
  useEffect(() => {
    void fetchRoom()
  }, [fetchRoom])

  // If already in room, go to lobby
  useEffect(() => {
    if (isInRoom) {
      router.replace(`/room/${roomId}/lobby`)
    }
  }, [isInRoom, router, roomId])

  const canJoin = useMemo(() => !!currentRoom && !isInRoom, [currentRoom, isInRoom])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:60px_60px] opacity-40"></div>
      
      <div className="relative z-10 w-full max-w-2xl">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pb-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-10 h-10" />
              </div>
              <CardTitle className="text-3xl mb-2">Room Details</CardTitle>
              {currentRoom?.status && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                  {currentRoom.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Room</h3>
                <p className="text-gray-600">Fetching room information...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Room</h3>
                <p className="text-gray-600 text-sm mb-6">{error}</p>
                <Button 
                  onClick={() => fetchRoom()} 
                  variant="outline" 
                  size="lg"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {!isLoading && !error && currentRoom && (
              <div className="space-y-8">
                {/* Room Code */}
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2 flex items-center justify-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Room Code
                  </div>
                  <div className="text-4xl font-bold text-gray-800 tracking-widest font-mono bg-gray-100 px-6 py-3 rounded-lg">
                    {currentRoom.code}
                  </div>
                </div>

                {/* Room Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Host</div>
                        <div className="font-semibold text-gray-800">
                          {currentRoom.host?.name || currentRoom.host?.email || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Players</div>
                        <div className="font-semibold text-gray-800">
                          {currentRoom.players?.length ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Rounds</div>
                        <div className="font-semibold text-gray-800">
                          {currentRoom.numRounds ?? '—'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Round Time</div>
                        <div className="font-semibold text-gray-800">
                          {currentRoom.roundTime ?? '—'}s
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                <div className="text-center pt-4">
                  <Button 
                    onClick={async () => { await joinRoomAction(); }} 
                    disabled={!canJoin || isJoining}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Joining…
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5 mr-2" />
                        Join Room
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
