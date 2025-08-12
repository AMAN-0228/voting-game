'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoundStartButton } from './RoundStartButton'
import { usePersistentSocket } from '@/hooks/socket-hooks'
import { useGameStore } from '@/store/game-store'
import { API_ROUTES } from '@/constants/api-routes'
import { toast } from 'sonner'

interface RoundsManagementProps {
  roomId: string
  isHost: boolean
}

export function RoundsManagement({ roomId, isHost }: RoundsManagementProps) {
  const { socket } = usePersistentSocket()
  const { rounds, currentRound, updateRounds } = useGameStore()
  
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const response = await fetch(API_ROUTES.ROUNDS_MANAGEMENT.GET_BY_ROOM(roomId))
        if (!response.ok) {
          throw new Error('Failed to fetch rounds')
        }
        const data = await response.json()
        updateRounds(data.rounds || [])
      } catch (error) {
        console.error('Error fetching rounds:', error)
        toast.error('Failed to fetch rounds')
      }
    }

    fetchRounds()
  }, [roomId, updateRounds])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'active':
        return 'default'
      case 'voting':
        return 'outline'
      case 'finished':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toUpperCase()
  }

  // Filter rounds to only show current active round and completed rounds
  const visibleRounds = rounds.filter(round => 
    round.status === 'active' || round.status === 'finished'
  )

  if (!rounds.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rounds Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No rounds found for this game.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rounds Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleRounds.map((round) => (
            <div key={round.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Round {round.sno}</Badge>
                  <Badge variant={getStatusBadgeVariant(round.status)}>
                    {getStatusText(round.status)}
                  </Badge>
                  {currentRound?.id === round.id && (
                    <Badge variant="default" className="bg-green-500">
                      CURRENT
                    </Badge>
                  )}
                </div>
                {isHost && round.status === 'pending' && (
                  <RoundStartButton
                    roomId={roomId}
                    roundId={round.id}
                    roundNumber={round.sno}
                    isHost={isHost}
                    roundStatus={round.status}
                  />
                )}
              </div>
              <p className="text-gray-700 text-sm">{round.question}</p>
            </div>
          ))}
          
          {/* Show pending rounds count for hosts */}
          {isHost && rounds.some(r => r.status === 'pending') && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">
                  {rounds.filter(r => r.status === 'pending').length} pending rounds
                </span> - Use the round start API to begin them when ready.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
