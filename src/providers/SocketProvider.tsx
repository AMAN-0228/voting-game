"use client"

import { ReactNode, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { socketClient } from '@/lib/socket-client'
import { useWebSocketStore } from '@/store/websocket-store'
import { useRoomStore } from '@/store/room-store'
import { useGameStore } from '@/store/game-store'

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession()
  const { 
    setIsConnecting, 
    setSocket, 
    setConnectionError,
    resetWebSocketState
  } = useWebSocketStore()

  // Connect socket when user is authenticated
  const connectSocket = useCallback(() => {
    if (status === 'authenticated' && session?.user?.id && session?.user?.email) {
      if (!socketClient.isConnected()) {
        setIsConnecting(true)
        setConnectionError(null)
        
        try {
          const socket = socketClient.connect(
            session.user.id,
            session.user.email,
            session.user.name || undefined
          )
          
          // Store socket reference in store
          setSocket(socket)
        } catch (error) {
          console.error('Failed to connect socket:', error)
          setConnectionError('Failed to connect to server')
          setIsConnecting(false)
        }
      }
    }
  }, [status, session?.user?.id, session?.user?.email, session?.user?.name, setIsConnecting, setConnectionError, setSocket])

  // Disconnect socket when user is not authenticated
  const disconnectSocket = useCallback(() => {
    if (socketClient.isConnected()) {
      socketClient.disconnect()
      resetWebSocketState()
    }
  }, [resetWebSocketState])

  // Handle authentication state changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      connectSocket()
    } else if (status === 'unauthenticated') {
      disconnectSocket()
    }
  }, [status, session?.user, connectSocket, disconnectSocket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [disconnectSocket])

  return <>{children}</>
}
export default SocketProvider

