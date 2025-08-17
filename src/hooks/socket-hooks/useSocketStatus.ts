import { useEffect, useState } from 'react'
import { useWebSocketStore } from '@/store/websocket-store'
import { SOCKET_EVENTS } from '@/constants/api-routes'

interface SocketStatus {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  lastConnectionAttempt: Date | null
  connectionCount: number
  disconnectionCount: number
}

export function useSocketStatus() {
  const { socket, isConnected, isConnecting, connectionError } = useWebSocketStore()
  const [status, setStatus] = useState<SocketStatus>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    lastConnectionAttempt: null,
    connectionCount: 0,
    disconnectionCount: 0
  })

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      console.log('[SOCKET STATUS] Connected')
      setStatus(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        lastConnectionAttempt: new Date(),
        connectionCount: prev.connectionCount + 1
      }))
    }

    const handleDisconnect = (reason: string) => {
      console.log('[SOCKET STATUS] Disconnected:', reason)
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        disconnectionCount: prev.disconnectionCount + 1
      }))
    }

    const handleConnectError = (error: Error) => {
      console.error('[SOCKET STATUS] Connection error:', error.message)
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: error.message
      }))
    }

    // Set up event listeners
    socket.on(SOCKET_EVENTS.CONNECT, handleConnect)
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect)
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError)

    // Initial status
    setStatus(prev => ({
      ...prev,
      isConnected: socket.connected,
      isConnecting: isConnecting,
      connectionError: connectionError
    }))

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect)
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect)
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError)
    }
  }, [socket, isConnecting, connectionError])

  // Update status when store values change
  useEffect(() => {
    setStatus(prev => ({
      ...prev,
      isConnected,
      isConnecting,
      connectionError
    }))
  }, [isConnected, isConnecting, connectionError])

  return status
}
