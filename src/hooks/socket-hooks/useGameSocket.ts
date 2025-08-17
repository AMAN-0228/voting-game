import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useSocket } from './useSocket'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import { useAuthStore, useGameStore } from '@/store'
import type { Round } from '@/store/game-store'
import { useSessionContext } from '@/components'

interface UseGameSocketProps {
  roomId: string
  onGameStart?: () => void
  onRoundStart?: () => void
  onRoundEnd?: (scores: Record<string, number>) => void
  onAnswerSubmitted?: (userId: string, answer: string) => void
  onVoteSubmitted?: (userId: string, votedForUserId: string) => void
  onTimerTick?: (timeLeft: number, phase: string) => void
  onTimerEnd?: (phase: string) => void
}

export function useGameSocket({
  roomId,
  onGameStart,
  onRoundStart,
  onRoundEnd,
  onAnswerSubmitted,
  onVoteSubmitted,
  onTimerTick,
  onTimerEnd
}: UseGameSocketProps) {
  console.log('__________ useGameSocket __________', roomId);
  const { socket } = useSocket()

  const { user } = useSessionContext()

  const {
    roundId,
    setCurrentRound,
    updateRounds,
    setTotalRounds,
    setGamePhase,
    setHasSubmittedAnswer,
    setHasVoted,
    setUserAnswer,
    setVotedAnswerId,
    setAnswers,
    setVotes,
   } = useGameStore()

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!socket) return
      console.log('__________ submitAnswer __________', roomId, roundId, answer);
      if (answer.trim() === '') {
        toast.error('Please enter an answer')
        return
      }
      socket.emit(SOCKET_EVENTS.GAME_ANSWER_SUBMIT, { roomId, roundId, answer })
    },
    [socket, roomId, roundId]
  )

  const submitVote = useCallback(
    (votedAnswerId: string) => {
      if (!socket) return
      socket.emit(SOCKET_EVENTS.GAME_VOTE_SUBMIT, { roomId, roundId, votedAnswerId })
    },
    [socket, roomId, roundId]
  )

  const sendForGameStateSync = useCallback(( roomId: string ) => {

    console.log('__________ sendForGameStateSync __________', roomId);
    if (!socket) return
    socket.emit(SOCKET_EVENTS.GAME_STATE_REQUEST, { roomId })
  }, [socket, roomId])

  const handleGameStateSync = useCallback((data: { roomId: string; currentRound: Round; totalRounds: number; status: string; currentQuestion?: string; timeRemaining: number; answers: Array<{ userId: string; answer: string; id: string }>; votes: Array<{ userId: string; answerId: string }> }) => {
    console.log('Game state synced:', data)
    const UserAnswered = data.answers.find(answer => answer.userId === user?.id)
    const votesMap = new Map<string, string[]>()
    data.votes.forEach((vote) => {
      votesMap.set(vote.answerId, [...(votesMap.get(vote.answerId) || []), vote.userId])
    })
    console.log('__________ votesMap in handleGameStateSync __________', votesMap);
    console.log('__________ data.votes __________', data.votes);
    
    const UserVoted = data.votes.find(vote => vote.userId === user?.id) ;
    setHasSubmittedAnswer(!!UserAnswered)
    setUserAnswer(UserAnswered?.answer || '')
    setHasVoted(!!UserVoted)
    setVotedAnswerId(UserVoted?.answerId || null)
    setCurrentRound({
      ...data.currentRound,
    })
    setTotalRounds(data.totalRounds)
    setGamePhase({ 
      type: data.status === 'answering' ? 'answering' : data.status === 'voting' ? 'voting' : 'waiting',
      timeLeft: data.timeRemaining,
      totalTime: data.timeRemaining,
      totalRounds: data.totalRounds,
      roundSno: data.currentRound.sno
    })
    setAnswers(data.answers)
    setVotes(votesMap)
  }, [setCurrentRound, setTotalRounds, setGamePhase])

  const handleGameStart = useCallback((data: { message: string, rounds: Array<{ id: string; question: string; sno: number }> }) => {
    console.log('Game started')
    // Convert the data to match our Round type
    const convertedRounds = data.rounds.map(round => ({
      id: round.id,
      question: round.question,
      status: 'pending' as const,
      sno: round.sno,
      createdAt: new Date().toISOString(),
      roomId: roomId,
      answers: [],
      votes: []
    }))
    updateRounds(convertedRounds)
    onGameStart?.()
  }, [updateRounds, onGameStart, roomId])

  const handleGameStateUpdate = useCallback((data: {totalRounds: number, currentRound: number}) => {
    console.log('Game state updated:', data)
    setTotalRounds(data.totalRounds)
  }, [setTotalRounds])

  const handleRoundStart = useCallback((data: { roomId: string; roundId: string; roundNumber: number; question: string; timeLeft: number; timeTotal: number }) => {
    console.log('Round started')
    console.log('__________ handleRoundStart __________', data);
    sendForGameStateSync(roomId)
    setGamePhase({ 
      type: 'answering',
      roundSno: data.roundNumber,
      timeLeft: data.timeLeft,
      totalTime: data.timeTotal
    })
    onRoundStart?.()
  }, [setGamePhase, onRoundStart, sendForGameStateSync])

  const handleRoundEnd = useCallback((data: { scores: Record<string, number> }) => {
    console.log('Round ended:', data.scores)
    onRoundEnd?.(data.scores)
  }, [onRoundEnd])

  const handleAnswerSubmitted = useCallback((data: { userId: string; answer: string }) => {
    console.log('Answer submitted:', data)
    setHasSubmittedAnswer(true)
    setUserAnswer(data.answer)
    onAnswerSubmitted?.(data.userId, data.answer)
  }, [onAnswerSubmitted, setHasSubmittedAnswer, setUserAnswer])

  const handleVoteSubmitted = useCallback((data: { userId: string; votedAnswerId: string }) => {
    console.log('Vote submitted:', data)
    setHasVoted(true)
    setVotedAnswerId(data.votedAnswerId)
    onVoteSubmitted?.(data.userId, data.votedAnswerId)
  }, [onVoteSubmitted, setHasVoted, setVotedAnswerId])

  const handleVotesUpdate = useCallback((data: { votes: Array<{ userId: string; votedAnswerId: string }> }) => {
    console.log('Votes updated:', data)
    const votesMap = new Map<string, string[]>()
    data.votes.forEach((vote) => {
      votesMap.set(vote.votedAnswerId, [...(votesMap.get(vote.votedAnswerId) || []), vote.userId])
    })
    console.log('__________ votesMap __________', votesMap);
    setVotes(votesMap)
  }, [setVotes])

  const handleTimerTick = useCallback((data: { timeLeft: number; phase: string }) => {
    onTimerTick?.(data.timeLeft, data.phase)
  }, [onTimerTick])

  const handleTimerEnd = useCallback((data: { phase: string }) => {
    console.log('Timer ended for phase:', data.phase)
    onTimerEnd?.(data.phase)
  }, [onTimerEnd])

  const handleGamePhaseUpdate = useCallback((data: { type: string, timeLeft: number, timeTotal: number, totalRounds: number, roundSno: number }) => {
    console.log('Game phase updated:', data)
    sendForGameStateSync(roomId)
    // setGamePhase({
    //   type: data.type,
    //   timeLeft: data.timeLeft,
    //   totalTime: data.timeTotal,
    //   totalRounds: data.totalRounds,
    //   roundSno: data.roundSno
    // })
  }, [sendForGameStateSync])

  useEffect(() => {
    if (!socket || !roomId) return
  
    console.log('🎮 [useGameSocket] Setting up game listeners for room:', roomId)
    console.log('🎮 [useGameSocket] Socket connected:', socket.connected)
    console.log('🎮 [useGameSocket] Socket ID:', socket.id)

    // Attach game event listeners
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleGameStart)
    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, handleGameStateUpdate)
    socket.on(SOCKET_EVENTS.GAME_ROUND_START, handleRoundStart)
    socket.on(SOCKET_EVENTS.GAME_ROUND_END, handleRoundEnd)
    socket.on(SOCKET_EVENTS.GAME_ANSWER_SUBMITTED, handleAnswerSubmitted)
    socket.on(SOCKET_EVENTS.GAME_VOTE_SUBMITTED, handleVoteSubmitted)
    socket.on(SOCKET_EVENTS.GAME_VOTES_UPDATE, handleVotesUpdate)
    socket.on(SOCKET_EVENTS.TIMER_TICK, handleTimerTick)
    socket.on(SOCKET_EVENTS.TIMER_END, handleTimerEnd)
    socket.on(SOCKET_EVENTS.GAME_STATE_RESPONSE, handleGameStateSync)
    socket.on(SOCKET_EVENTS.GAME_PHASE_UPDATE, handleGamePhaseUpdate)
    console.log('🎮 [useGameSocket] All listeners attached')
  
    // Cleanup
    return () => {
      console.log('🎮 [useGameSocket] Cleaning up game listeners for room:', roomId)
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleGameStart)
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE, handleGameStateUpdate)
      socket.off(SOCKET_EVENTS.GAME_ROUND_START, handleRoundStart)
      socket.off(SOCKET_EVENTS.GAME_ROUND_END, handleRoundEnd)
      socket.off(SOCKET_EVENTS.GAME_ANSWER_SUBMIT, handleAnswerSubmitted)
      socket.off(SOCKET_EVENTS.GAME_VOTE_SUBMITTED, handleVoteSubmitted)
      socket.off(SOCKET_EVENTS.GAME_VOTES_UPDATE, handleVotesUpdate)
      socket.off(SOCKET_EVENTS.TIMER_TICK, handleTimerTick)
      socket.off(SOCKET_EVENTS.TIMER_END, handleTimerEnd)
      socket.off(SOCKET_EVENTS.GAME_STATE_SYNC, handleGameStateSync)
    }
  }, [socket, roomId, handleGameStart, handleRoundStart, handleRoundEnd, handleAnswerSubmitted, handleVoteSubmitted, handleTimerTick, handleTimerEnd, handleGameStateSync])

  return {
    submitAnswer,
    submitVote,
    sendForGameStateSync,
    isConnected: socket?.connected || false,
  }
}