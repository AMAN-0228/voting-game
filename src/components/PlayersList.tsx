'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Crown, Wifi, WifiOff, Clock, UserCheck, UserX } from 'lucide-react'

interface PlayerItem {
  id: string
  name?: string
  email?: string
  isOnline: boolean
  joinedAt: string
}

interface PlayersListProps {
  players: PlayerItem[]
  onlinePlayers: string[]
  hostId?: string
}

export const PlayersList = ({ players, onlinePlayers, hostId }: PlayersListProps) => {
  const onlineCount = players.filter(p => onlinePlayers.includes(p.id)).length
  const totalPlayers = players.length

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            Players
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              <Wifi className="w-3 h-3 mr-1" />
              {onlineCount} online
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              {totalPlayers} total
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {players.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Players Yet</h3>
            <p className="text-gray-600 text-sm">Players will appear here when they join the room.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Host Section */}
            {hostId && (
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Room Host
                </div>
                {(() => {
                  const host = players.find(p => p.id === hostId)
                  if (!host) return null
                  
                  const isOnline = onlinePlayers.includes(host.id)
                  return (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Crown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                                          <p className="font-bold text-gray-800 text-lg">
                              {host.name || host.email || `Player ${host.id.slice(0, 8)}`}
                            </p>
                              <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                Host
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>Joined {new Date(host.joinedAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isOnline ? (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              <Wifi className="w-3 h-3 mr-1" />
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                              <WifiOff className="w-3 h-3 mr-1" />
                              Offline
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Other Players */}
            {players.filter(p => p.id !== hostId).length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Other Players
                </div>
                <div className="space-y-3">
                  {players
                    .filter(p => p.id !== hostId)
                    .map((player) => {
                      const isOnline = onlinePlayers.includes(player.id)
                      const isHost = hostId && player.id === hostId
                      
                      return (
                        <div 
                          key={player.id} 
                          className={`group p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                            isOnline 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
                              : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isOnline 
                                  ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                  : 'bg-gradient-to-br from-gray-300 to-gray-400'
                              }`}>
                                {isOnline ? (
                                  <UserCheck className="w-5 h-5 text-white" />
                                ) : (
                                  <UserX className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={`font-semibold ${
                                    isOnline ? 'text-gray-800' : 'text-gray-600'
                                  }`}>
                                    {player.name || player.email}
                                  </p>
                                  {isHost && (
                                    <Badge variant="destructive" className="bg-yellow-500 text-yellow-900 border-yellow-400 text-xs">
                                      Host
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>Joined {new Date(player.joinedAt).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isOnline ? (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                  <Wifi className="w-3 h-3 mr-1" />
                                  Online
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                                  <WifiOff className="w-3 h-3 mr-1" />
                                  Offline
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Online Status Indicator */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                            <div className={`w-2 h-2 rounded-full ${
                              isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-xs text-gray-500">
                              {isOnline ? 'Currently active in the game' : 'Last seen recently'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
