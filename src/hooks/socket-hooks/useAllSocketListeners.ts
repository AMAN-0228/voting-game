import { useEffect, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { useGameSocket } from './useGameSocket'
import { useRoomSocket } from './useRoomSocket'
import { useWebSocketStore } from '@/store/websocket-store'

interface UseAllSocketListenersProps {
  roomId?: string
}

export function useAllSocketListeners(socket: Socket | null, options: UseAllSocketListenersProps = {}) {
  const { setLastEvent } = useWebSocketStore()
  const { roomId = '' } = options

  console.log('[useAllSocketListeners] Called with:', { socket: !!socket, roomId })

  // Memoize callback functions to prevent infinite re-renders
  const onGameStart = useCallback(() => 
    setLastEvent('game:start', { timestamp: Date.now() }), [setLastEvent])
  
  const onRoundStart = useCallback(() => 
    setLastEvent('game:round:start', { timestamp: Date.now() }), [setLastEvent])
  
  const onRoundEnd = useCallback((scores: Record<string, number>) => 
    setLastEvent('game:round:end', { scores, timestamp: Date.now() }), [setLastEvent])
  
  const onAnswerSubmitted = useCallback((userId: string, answer: string) => 
    setLastEvent('game:answer:submit', { userId, answer, timestamp: Date.now() }), [setLastEvent])
  
  const onVoteSubmitted = useCallback((userId: string, votedForUserId: string) =>
    setLastEvent('game:vote:submit', { userId, votedForUserId, timestamp: Date.now() }), [setLastEvent])
  
  const onTimerTick = useCallback((timeLeft: number, phase: string) =>
    setLastEvent('timer:tick', { timeLeft, phase, timestamp: Date.now() }), [setLastEvent])
  
  const onTimerEnd = useCallback((phase: string) =>
    setLastEvent('timer:end', { phase, timestamp: Date.now() }), [setLastEvent])

  const onPlayerJoin = useCallback((userId: string) =>
    setLastEvent('room:join', { userId, timestamp: Date.now() }), [setLastEvent])
  
  const onPlayerLeave = useCallback((userId: string) =>
    setLastEvent('room:leave', { userId, timestamp: Date.now() }), [setLastEvent])
  
  const onRoomUpdate = useCallback((players: Array<{ id: string; name?: string; email?: string }>) =>
    setLastEvent('room:update', { players, timestamp: Date.now() }), [setLastEvent])

  // Initialize game socket listeners (only if in a room)
  useGameSocket({
    roomId: roomId || '',
    roundId: '',
    onGameStart,
    onRoundStart,
    onRoundEnd,
    onAnswerSubmitted,
    onVoteSubmitted,
    onTimerTick,
    onTimerEnd
  })

  // Initialize room socket listeners
  useRoomSocket({
    roomId: roomId || '',
    onPlayerJoin,
    onPlayerLeave,
    onRoomUpdate
  })

  // Handle connection events
  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      console.log('Socket connected:', socket.id)
      setLastEvent('connect', { timestamp: Date.now() })
    }

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason)
      setLastEvent('disconnect', { reason, timestamp: Date.now() })
    }

    const handleError = (error: Error) => {
      console.error('Socket error:', error)
      setLastEvent('error', { error: error.message, timestamp: Date.now() })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('error', handleError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('error', handleError)
    }
  }, [socket, setLastEvent])
}
