import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Socket } from 'socket.io-client'
import { getOrCreateSocket, getSocketClient, isSocketConnected } from '@/lib/socket-client'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import type { SocketClient } from '@/lib/socket-client'

interface UseSocketReturn {
  socket: SocketClient | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  emit: (event: string, data: unknown) => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  connect: () => Promise<void>
  disconnect: () => void
}

/**
 * Consolidated hook that provides access to the persistent socket connection
 * This hook ensures the socket connection persists across page navigation
 * and component lifecycle changes
 */
export function useSocket(): UseSocketReturn {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<SocketClient | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      throw new Error('User not authenticated')
    }

    const userId = session.user.id
    const username = session.user.name || session.user.email || 'Unknown User'

    const existingSocket = getSocketClient()
    if (existingSocket && isSocketConnected()) {
      setSocket(existingSocket)
      setIsConnected(true)
      return
    }

    setIsConnecting(true)
    setError(null)
    
    try {
      const newSocket = await getOrCreateSocket({ userId, username })
      setSocket(newSocket)
      setIsConnected(newSocket.connected)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect socket'
      setError(errorMessage)
      console.error('Socket connection failed:', err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [status, session?.user?.id, session?.user?.name, session?.user?.email])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
    }
    setSocket(null)
    setIsConnected(false)
    setError(null)
  }, [socket])

  // Auto-connect when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !socket) {
      connect().catch(console.error)
    }
  }, [status, session?.user, socket, connect])

  // Listen to socket connection events
  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      console.log('🔌 useSocket: Socket connected')
      setIsConnected(true)
      setError(null)
    }

    const handleDisconnect = () => {
      console.log('🔌 useSocket: Socket disconnected')
      setIsConnected(false)
    }

    const handleConnectError = (err: Error) => {
      console.error('🔌 useSocket: Connection error:', err)
      setError(err.message)
      setIsConnected(false)
    }

    // Set initial connection state
    setIsConnected(socket.connected)

    // Listen to connection events
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    // Cleanup
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
    }
  }, [socket])

  const emit = useCallback((event: string, data: unknown) => {
    if (socket?.connected) {
      const typedSocket = socket as Socket & { emit: (event: string, data: unknown) => void }
      typedSocket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }, [socket])

  const joinRoom = useCallback((roomId: string) => {
    if (socket?.connected) {
      console.log('🔌 useSocket: Joining socket room:', roomId)
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId })
    } else {
      console.warn('🔌 useSocket: Socket not connected, cannot join room')
    }
  }, [socket])

  const leaveRoom = useCallback((roomId: string) => {
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId })
    } else {
      console.warn('Socket not connected, cannot leave room')
    }
  }, [socket])

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    emit,
    joinRoom,
    leaveRoom,
    connect,
    disconnect
  }
}
