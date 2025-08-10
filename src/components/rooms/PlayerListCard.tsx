import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Player {
  id: string
  name?: string | null
  email?: string | null
  isOnline?: boolean
}

interface PlayersListCardProps {
  players?: Player[]
  hostId: string
}

export function PlayersListCard({ players = [], hostId }: PlayersListCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm text-blue-600 font-medium uppercase tracking-wider">
            Players ({players.length})
          </div>
        </div>
      </div>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {players.length > 0 ? (
          players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-blue-200/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    player.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-gray-800">
                  {player.name || player.email}
                </span>
              </div>
              {player.id === hostId && (
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                  Host
                </Badge>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-blue-600 text-sm font-medium">No players yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
