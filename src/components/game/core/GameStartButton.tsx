'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'
import { usePersistentSocket } from '@/hooks/socket-hooks'
import { toast } from 'sonner'

interface GameStartButtonProps {
  roomId: string
  isHost: boolean
  roomStatus: string
}

export default function GameStartButton({ roomId, isHost, roomStatus }: GameStartButtonProps) {
  const [isStarting, setIsStarting] = useState(false)
  const { socket, isConnected } = usePersistentSocket()

  const handleStartGame = async () => {
    if (!isConnected || !socket) {
      toast.error('Not connected to game server')
      return
    }

    if (!isHost) {
      toast.error('Only the host can start the game')
      return
    }

    if (roomStatus !== 'starting') {
      toast.error('Room is not ready to start')
      return
    }

    setIsStarting(true)
    
    try {
      // Emit game start event
      socket.emit('game:start', { roomId, numRounds: 3 })
      
      toast.success('Starting game...')
    } catch (error) {
      console.error('Failed to start game:', error)
      toast.error('Failed to start game')
    } finally {
      setIsStarting(false)
    }
  }

  // Only show button if user is host and room is in starting status
  if (!isHost || roomStatus !== 'starting') {
    return null
  }

  return (
    <Button
      onClick={handleStartGame}
      disabled={isStarting || !isConnected}
      size="lg"
      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
    >
      {isStarting ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Starting Game...
        </>
      ) : (
        <>
          <Play className="w-5 h-5 mr-2" />
          Start Game
        </>
      )}
    </Button>
  )
}
