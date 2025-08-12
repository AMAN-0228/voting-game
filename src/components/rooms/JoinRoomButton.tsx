"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { roomHelpers } from '@/lib/api-helpers'
import { useRoomStore } from '@/store/room-store'
import { usePersistentSocket } from '@/hooks/socket-hooks'
import { Button } from '@/components/ui/button'
import { Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  roomId: string
  onSuccess?: () => void
}

export default function JoinRoomButton({ roomId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { setIsInRoom } = useRoomStore()
  const { joinRoom, isConnected } = usePersistentSocket()

  const onClick = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Use centralized API helper instead of socket client
      const result = await roomHelpers.joinRoomById(roomId)
      if (result.error) {
        setError(result.error || 'Failed to join room')
        return
      }
      
      // After successful API call, emit socket event
      if (isConnected) {
        joinRoom(roomId)
      } else {
        console.warn('Socket not connected, skipping room:join emission')
      }
      
      // Update room state
      setIsInRoom(true)
      setSuccess(true)
      
      // Call success callback or navigate to room
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/room/${roomId}`)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="inline-flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Joined!</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-3">
      <Button
        onClick={onClick}
        disabled={loading}
        size="sm"
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Joining…
          </>
        ) : (
          <>
            <Users className="w-4 h-4 mr-2" />
            Join Room
          </>
        )}
      </Button>
      
      {error && (
        <div className="inline-flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}
