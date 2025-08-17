"use client"

import { ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useWebSocketStore } from '@/store/websocket-store'

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession()
  const { socket, isConnected, connect, disconnect } = useWebSocketStore()

  console.log('[SocketProvider] Session status:', status)
  console.log('[SocketProvider] Session data:', { 
    userId: session?.user?.id, 
    userEmail: session?.user?.email, 
    userName: session?.user?.name 
  })

  console.log('[SocketProvider] Socket state:', { socket: !!socket, isConnected })

  // Note: Room-specific socket listeners are now handled in room components
  // via useRoomSocketListeners hook when user is actually in a room

  // Handle authentication state changes
  useEffect(() => {
    console.log('[SocketProvider] Auth state changed:', { status, hasUser: !!session?.user })
    
    if (status === 'authenticated' && session?.user) {
      console.log('[SocketProvider] Calling connect()...')
      connect(session.user.id, session.user.name || session.user.email || 'Unknown User')
    } else if (status === 'unauthenticated') {
      console.log('[SocketProvider] Calling disconnect()...')
      disconnect()
    }
  }, [status, session?.user, connect, disconnect])

  return <>{children}</>
}
export default SocketProvider

