import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Socket } from 'socket.io-client'
import { getOrCreateSocket, getSocketClient, isSocketConnected } from '@/lib/socket-client'
import type { SocketClient } from '@/lib/socket-client'

/**
 * Hook that provides access to the persistent socket connection
 * This hook ensures the socket connection persists across page navigation
 * and component lifecycle changes
 */
export function usePersistentSocket() {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<SocketClient | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      setSocket(null)
      return
    }

    const userId = session.user.id
    const username = session.user.name || session.user.email || 'Unknown User'

    const existingSocket = getSocketClient()
    if (existingSocket && isSocketConnected()) {
      setSocket(existingSocket)
      return
    }

    const connectSocket = async () => {
      setIsConnecting(true)
      setError(null)
      try {
        const newSocket = await getOrCreateSocket({ userId, username })
        setSocket(newSocket)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect socket'
        setError(errorMessage)
        console.error('Socket connection failed:', err)
      } finally {
        setIsConnecting(false)
      }
    }

    connectSocket()
  }, [status, session?.user?.id, session?.user?.name, session?.user?.email])

  // Cleanup local state only - don't disconnect global socket
  useEffect(() => {
    return () => {
      setSocket(null)
    }
  }, [])

  return {
    socket,
    isConnected: socket?.connected || false,
    isConnecting,
    error,
    emit: (event: string, data: unknown) => {
      if (socket?.connected) {
        // Use proper typing for dynamic events
        const typedSocket = socket as Socket & { emit: (event: string, data: unknown) => void }
        typedSocket.emit(event, data)
      } else {
        console.warn('Socket not connected, cannot emit event:', event)
      }
    },
    joinRoom: (roomId: string) => {
      if (socket?.connected) {
        socket.emit('room:join', { roomId })
      } else {
        console.warn('Socket not connected, cannot join room:', roomId)
      }
    },
    leaveRoom: (roomId: string) => {
      if (socket?.connected) {
        socket.emit('room:leave', { roomId })
      } else {
        console.warn('Socket not connected, cannot leave room:', roomId)
      }
    }
  }
}
