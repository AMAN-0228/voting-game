import { useCallback } from 'react'
import { useWebSocketStore } from '@/store/websocket-store'
import { initSocketClient, disconnectSocket } from '@/lib/socket-client'

interface UseSocketConnectionProps {
  userId: string
  userEmail: string
  userName?: string | null
}

export function useSocketConnection({ userId, userEmail, userName }: UseSocketConnectionProps) {
  const { socket, setSocket, setIsConnected } = useWebSocketStore()

  console.log('[useSocketConnection] Called with:', { userId, userEmail, userName })

  const connect = useCallback(() => {
    console.log('[useSocketConnection] Connect called with userId:', userId)
    
    if (!userId) {
      console.warn('Cannot connect socket: userId is required')
      return
    }

    try {
      console.log('[useSocketConnection] Attempting to connect...')
      setIsConnected(false)
      const newSocket = initSocketClient(userId, userName || userEmail)
      if (newSocket) {
        console.log('[useSocketConnection] Socket created successfully')
        
        // Set up connection event listeners immediately
        const handleConnect = () => {
          console.log('[useSocketConnection] Socket connected event fired:', newSocket.id)
          setIsConnected(true)
        }

        const handleDisconnect = (reason: string) => {
          console.log('[useSocketConnection] Socket disconnected event fired:', reason)
          setIsConnected(false)
        }

        // Attach listeners immediately
        newSocket.on('connect', handleConnect)
        newSocket.on('disconnect', handleDisconnect)
        
        // Store the socket
        setSocket(newSocket)
        
        console.log('[useSocketConnection] Event listeners attached and socket stored')
      } else {
        console.error('Failed to initialize socket client')
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Error connecting socket:', error)
      setIsConnected(false)
    }
  }, [userId, userName, userEmail, setSocket, setIsConnected])

  const disconnect = useCallback(() => {
    disconnectSocket()
    setSocket(null)
    setIsConnected(false)
  }, [setSocket, setIsConnected])

  // Note: Event listeners are now set up immediately when socket is created
  // This useEffect is no longer needed

  return {
    socket,
    connect,
    disconnect
  }
}