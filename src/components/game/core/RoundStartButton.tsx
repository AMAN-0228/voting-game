'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { API_ROUTES } from '@/constants/api-routes'

interface RoundStartButtonProps {
  roomId: string
  roundId: string
  roundNumber: number
  isHost: boolean
  roundStatus: string
}

export function RoundStartButton({ roomId, roundId, roundNumber, isHost, roundStatus }: RoundStartButtonProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStartRound = async () => {
    if (!isHost) {
      toast.error('Only the host can start rounds')
      return
    }

    if (roundStatus !== 'pending') {
      toast.error('Round is not in pending status')
      return
    }

    setIsStarting(true)
    try {
      const response = await fetch(API_ROUTES.ROUNDS_MANAGEMENT.START_BY_ROOM(roomId, roundId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Round ${roundNumber} started successfully!`)
        console.log('Round started:', data)
      } else {
        toast.error(data.error || 'Failed to start round')
      }
    } catch (error) {
      console.error('Error starting round:', error)
      toast.error('Failed to start round')
    } finally {
      setIsStarting(false)
    }
  }

  if (!isHost || roundStatus !== 'pending') {
    return null
  }

  return (
    <Button
      onClick={handleStartRound}
      disabled={isStarting}
      variant="outline"
      size="sm"
      className="w-full"
    >
      {isStarting ? 'Starting...' : `Start Round ${roundNumber}`}
    </Button>
  )
}
