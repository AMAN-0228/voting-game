import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSocket } from './useSocket'
import { SOCKET_EVENTS } from '@/constants/api-routes'

/**
 * Hook for handling socket errors globally
 * Should be used at the app root level
 */
export function useSocketErrors() {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleRoomError = ({ message }: { message: string }) => {
      console.error('Room error:', message)
      toast.error(message)
    }

    const handleGameError = ({ message }: { message: string }) => {
      console.error('Game error:', message)
      toast.error(message)
    }

    const handleGeneralError = ({ message }: { message: string }) => {
      console.error('Socket error:', message)
      toast.error(message)
    }

    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError)
    socket.on(SOCKET_EVENTS.GAME_ERROR, handleGameError)
    socket.on(SOCKET_EVENTS.ERROR, handleGeneralError)

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError)
      socket.off(SOCKET_EVENTS.GAME_ERROR, handleGameError)
      socket.off(SOCKET_EVENTS.ERROR, handleGeneralError)
    }
  }, [socket])
}
