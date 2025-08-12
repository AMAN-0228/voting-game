import { useEffect } from 'react'
import { toast } from 'sonner'
import { useWebSocketStore } from '@/store/websocket-store'

export function useErrorSocket() {
  const { socket } = useWebSocketStore()

  useEffect(() => {
    if (!socket) return

    const handleRoomError = ({ message }: { message: string }) => {
      toast.error(message)
    }

    const handleGameError = ({ message }: { message: string }) => {
      toast.error(message)
    }

    socket.on('room:error', handleRoomError)
    socket.on('game:error', handleGameError)

    return () => {
      socket.off('room:error', handleRoomError)
      socket.off('game:error', handleGameError)
    }
  }, [socket])
}