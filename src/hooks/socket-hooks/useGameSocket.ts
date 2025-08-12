import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import { useWebSocketStore } from '@/store/websocket-store'
import { useGameStore } from '@/store/game-store'
import { useRoomStore } from '@/store/room-store'
import type { Timer } from '@/lib/timer-manager'

interface UseGameSocketProps {
  roomId: string
  roundId: string
  onGameStart?: () => void
  onRoundStart?: () => void
  onRoundEnd?: (scores: Record<string, number>) => void
  onAnswerSubmitted?: (userId: string, answer: string) => void
  onVoteSubmitted?: (userId: string, votedForUserId: string) => void
  onTimerTick?: (timeLeft: number, phase: Timer['phase']) => void
  onTimerEnd?: (phase: Timer['phase']) => void
}

export function useGameSocket({
  roomId,
  roundId,
  onGameStart,
  onRoundStart,
  onRoundEnd,
  onAnswerSubmitted,
  onVoteSubmitted,
  onTimerTick,
  onTimerEnd
}: UseGameSocketProps) {
  const { socket, setLastEvent } = useWebSocketStore()
  const {
    setGamePhase,
    setCurrentRound,
    updateRounds,
    setScores,
    setHasSubmittedAnswer,
    setHasVoted,
    setPlayersOnline
  } = useGameStore()
  const { updateRoomStatus } = useRoomStore()

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!socket) return
      socket.emit(SOCKET_EVENTS.SUBMIT_ANSWER, { roomId, roundId, answer })
    },
    [socket, roomId, roundId]
  )

  const submitVote = useCallback(
    (votedForUserId: string) => {
      if (!socket) return
      socket.emit(SOCKET_EVENTS.SUBMIT_VOTE, { roomId, roundId, votedForUserId })
    },
    [socket, roomId, roundId]
  )

  useEffect(() => {
    if (!socket) return

    // Game started
    const handleGameStarted = (data: {
      roomId: string
      totalRounds: number
      rounds: Array<{ id: string; roundNumber: number }>
    }) => {
      console.log('Game started:', data)
      setLastEvent(SOCKET_EVENTS.GAME_STARTED, data)
      updateRoomStatus('in_progress')
      updateRounds(data.rounds.map(r => ({
        id: r.id,
        sno: r.roundNumber,
        status: 'pending',
        question: '',
        createdAt: new Date().toISOString(),
        roomId: data.roomId,
        answers: [],
        votes: []
      })))
      onGameStart?.()
      toast.success('Game started!')
    }

    // Round started
    const handleRoundStarted = (data: {
      roomId: string
      roundId: string
      roundNumber: number
      question: string
      timeLeft: number
      timeTotal: number
    }) => {
      console.log('Round started:', data)
      setLastEvent(SOCKET_EVENTS.ROUND_STARTED, data)
      setGamePhase({
        type: 'answering',
        timeLeft: data.timeLeft,
        totalTime: data.timeTotal
      })
      setCurrentRound({
        id: data.roundId,
        sno: data.roundNumber,
        question: data.question,
        createdAt: new Date().toISOString(),
        roomId: data.roomId,
        answers: [],
        votes: []
      })
      setHasSubmittedAnswer(false)
      setHasVoted(false)
      onRoundStart?.()
      toast.info('Round started')
    }

    // Timer tick
    const handleTimerTick = (data: {
      roomId: string
      roundId: string
      phase: Timer['phase']
      timeLeft: number
      serverTime: number
    }) => {
      setLastEvent(SOCKET_EVENTS.TIMER_TICK, data)
      setGamePhase(prev => ({
        ...prev,
        type: data.phase,
        timeLeft: data.timeLeft
      }))
      onTimerTick?.(data.timeLeft, data.phase)
    }

    // Round ended
    const handleRoundEnded = (data: {
      roomId: string
      roundId: string
      scores: Record<string, number>
    }) => {
      console.log('Round ended:', data)
      setLastEvent(SOCKET_EVENTS.ROUND_ENDED, data)
      setGamePhase({ type: 'results' })
      setScores(Object.entries(data.scores).map(([userId, points]) => ({
        userId,
        points,
        user: undefined
      })))
      onRoundEnd?.(data.scores)
      toast.info('Round ended')
    }

    // Answer submitted
    const handleAnswerSubmitted = (data: {
      roomId: string
      roundId: string
      userId: string
      answer: string
    }) => {
      setLastEvent(SOCKET_EVENTS.ANSWER_SUBMITTED, data)
      if (data.userId === socket.data?.userId) {
        setHasSubmittedAnswer(true)
        toast.success('Answer submitted successfully')
      }
      onAnswerSubmitted?.(data.userId, data.answer)
    }

    // Vote submitted
    const handleVoteSubmitted = (data: {
      roomId: string
      roundId: string
      userId: string
      votedForUserId: string
    }) => {
      setLastEvent(SOCKET_EVENTS.VOTE_SUBMITTED, data)
      if (data.userId === socket.data?.userId) {
        setHasVoted(true)
        toast.success('Vote submitted successfully')
      }
      onVoteSubmitted?.(data.userId, data.votedForUserId)
    }

    // Timer ended
    const handleTimerEnded = (data: {
      roomId: string
      roundId: string
      phase: Timer['phase']
    }) => {
      setLastEvent(SOCKET_EVENTS.TIMER_ENDED, data)
      onTimerEnd?.(data.phase)
      toast.info(`${data.phase === 'answering' ? 'Answering' : 'Voting'} phase ended`)
    }

    // Error handling
    const handleGameError = (data: { message: string }) => {
      toast.error(data.message)
    }

    // Bind event handlers
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleGameStarted)
    socket.on(SOCKET_EVENTS.ROUND_STARTED, handleRoundStarted)
    socket.on(SOCKET_EVENTS.TIMER_TICK, handleTimerTick)
    socket.on(SOCKET_EVENTS.ROUND_ENDED, handleRoundEnded)
    socket.on(SOCKET_EVENTS.ANSWER_SUBMITTED, handleAnswerSubmitted)
    socket.on(SOCKET_EVENTS.VOTE_SUBMITTED, handleVoteSubmitted)
    socket.on(SOCKET_EVENTS.TIMER_ENDED, handleTimerEnded)
    socket.on(SOCKET_EVENTS.GAME_ERROR, handleGameError)

    // Cleanup
    return () => {
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleGameStarted)
      socket.off(SOCKET_EVENTS.ROUND_STARTED, handleRoundStarted)
      socket.off(SOCKET_EVENTS.TIMER_TICK, handleTimerTick)
      socket.off(SOCKET_EVENTS.ROUND_ENDED, handleRoundEnded)
      socket.off(SOCKET_EVENTS.ANSWER_SUBMITTED, handleAnswerSubmitted)
      socket.off(SOCKET_EVENTS.VOTE_SUBMITTED, handleVoteSubmitted)
      socket.off(SOCKET_EVENTS.TIMER_ENDED, handleTimerEnded)
      socket.off(SOCKET_EVENTS.GAME_ERROR, handleGameError)
    }
  }, [
    socket,
    roomId,
    roundId,
    setGamePhase,
    setCurrentRound,
    updateRounds,
    setScores,
    setHasSubmittedAnswer,
    setHasVoted,
    setPlayersOnline,
    updateRoomStatus,
    setLastEvent,
    onGameStart,
    onRoundStart,
    onRoundEnd,
    onAnswerSubmitted,
    onVoteSubmitted,
    onTimerTick,
    onTimerEnd
  ])

  return {
    submitAnswer,
    submitVote
  }
}