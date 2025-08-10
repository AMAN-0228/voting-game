import { useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { socketClient } from '@/lib/socket-client'
import { useWebSocketStore } from '@/store/websocket-store'
import { useGameStore } from '@/store/game-store'
import { useRoomStore } from '@/store/room-store'

export const useWebSocket = () => {
  const { data: session } = useSession()
  const { 
    socket, 
    isConnected, 
    isConnecting, 
    connectionError,
    currentRoomId,
    joinRoom: joinRoomSocket,
    leaveRoom: leaveRoomSocket,
    submitAnswer: submitAnswerSocket,
    submitVote: submitVoteSocket,
    startGame: startGameSocket,
    endGame: endGameSocket
  } = useWebSocketStore()

  // Join a room using the global socket
  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected')
      return
    }

    joinRoomSocket(roomId)
  }, [socket, isConnected, joinRoomSocket])

  // Leave current room using the global socket
  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected || !currentRoomId) return

    leaveRoomSocket()
  }, [socket, isConnected, currentRoomId, leaveRoomSocket])

  // Submit answer using the global socket
  const submitAnswer = useCallback((roundId: string, content: string) => {
    if (!socket || !isConnected) return

    submitAnswerSocket(roundId, content)
    useGameStore.getState().setUserAnswer(content)
  }, [socket, isConnected, submitAnswerSocket])

  // Submit vote using the global socket
  const submitVote = useCallback((roundId: string, answerId: string) => {
    if (!socket || !isConnected) return

    submitVoteSocket(roundId, answerId)
    useGameStore.getState().setVotedAnswerId(answerId)
    useGameStore.getState().setHasVoted(true)
  }, [socket, isConnected, submitVoteSocket])

  // Start game (host only) using the global socket
  const startGame = useCallback(() => {
    if (!socket || !isConnected || !currentRoomId) return

    startGameSocket()
  }, [socket, isConnected, currentRoomId, startGameSocket])

  // End game (host only) using the global socket
  const endGame = useCallback(() => {
    if (!socket || !isConnected || !currentRoomId) return

    endGameSocket()
  }, [socket, isConnected, currentRoomId, endGameSocket])

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    
    // Room methods
    joinRoom,
    leaveRoom,
    currentRoomId,
    
    // Game methods
    submitAnswer,
    submitVote,
    startGame,
    endGame,
    
    // Socket instance (for advanced usage)
    socket,
  }
}
