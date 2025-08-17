import { Card, CardTitle, PlayersList } from '@/components'

export const RoomSidebar = ({code, players, hostId}: {code: string, players: any[], hostId: string}) => {
    return (
      <div className="lg:col-span-1 space-y-6">
      <Card className="flex justify-center bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardTitle className="text-3xl mb-2 text-center">
          Room: {code}
        </CardTitle>
      </Card>
      {/* Sidebar */}
        <div className="space-y-6">
          <PlayersList 
            players={players || []} 
            onlinePlayers={players.map(player => player.id) || []}
            hostId={hostId}
          />
        </div>
    </div>
    )
} 