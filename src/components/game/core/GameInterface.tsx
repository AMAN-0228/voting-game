'use client'

import React, { useState, useEffect } from 'react'
import { usePersistentSocket } from '@/hooks/socket-hooks'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Vote, MessageSquare, CheckCircle } from 'lucide-react'

interface GameState {
  roomId: string
  currentRound: number
  totalRounds: number
  status: 'waiting' | 'question' | 'voting' | 'finished'
  currentQuestion?: string
  timeRemaining: number
  answers: Array<{ userId: string; answer: string }>
  votes: Array<{ userId: string; votedForUserId: string }>
}

interface GameInterfaceProps {
  roomId: string
  players: Array<{ id: string; name?: string; email?: string }>
}

export default function GameInterface({ roomId, players }: GameInterfaceProps) {
  const { socket, isConnected } = usePersistentSocket()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [userVote, setUserVote] = useState('')
  const [hasAnswered, setHasAnswered] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (!isConnected || !socket) return

    // Join game room
    socket.emit('game:join', { roomId })

    // Request current game state
    socket.emit('game:state:request', { roomId })

    // Set up event listeners
    const handleGameStarted = (data: any) => {
      toast.success('Game started!')
      console.log('Game started:', data)
    }

    const handleGameStateUpdate = (data: any) => {
      console.log('Game state updated:', data)
    }

    const handleRoundStart = (data: any) => {
      setGameState(prev => prev ? { ...prev, ...data, status: 'question' } : null)
      setHasAnswered(false)
      setUserAnswer('')
      toast.info(`Round ${data.roundNumber} started!`)
      console.log('Round started:', data)
    }

    const handleVotingStart = (data: any) => {
      setGameState(prev => prev ? { ...prev, ...data, status: 'voting' } : null)
      setHasVoted(false)
      setUserVote('')
      toast.info('Voting phase started!')
      console.log('Voting started:', data)
    }

    const handleAnswersUpdate = (data: any) => {
      setGameState(prev => prev ? { ...prev, answers: data.answers } : null)
      console.log('Answers updated:', data)
    }

    const handleVotesUpdate = (data: any) => {
      setGameState(prev => prev ? { ...prev, votes: data.votes } : null)
      console.log('Votes updated:', data)
    }

    const handleGameStateSync = (data: any) => {
      setGameState(data)
      console.log('Game state synced:', data)
    }

    const handleGameError = (data: { message: string }) => {
      toast.error(data.message)
      console.error('Game error:', data.message)
    }

    const handleAnswerSubmitted = (data: any) => {
      setHasAnswered(true)
      toast.success('Answer submitted!')
    }

    const handleVoteSubmitted = (data: any) => {
      setHasVoted(true)
      toast.success('Vote submitted!')
    }

    // Attach event listeners
    ;(socket as any).on('game:started', handleGameStarted)
    ;(socket as any).on('game:state:update', handleGameStateUpdate)
    socket.on('game:round:start', handleRoundStart)
    socket.on('game:voting:start', handleVotingStart)
    ;(socket as any).on('game:answers:update', handleAnswersUpdate)
    ;(socket as any).on('game:votes:update', handleVotesUpdate)
    ;(socket as any).on('game:state:sync', handleGameStateSync)
    socket.on('game:error', handleGameError)
    ;(socket as any).on('game:answer:submitted', handleAnswerSubmitted)
    ;(socket as any).on('game:vote:submitted', handleVoteSubmitted)

    // Cleanup
    return () => {
      ;(socket as any).off('game:started', handleGameStarted)
      ;(socket as any).off('game:state:update', handleGameStateUpdate)
      socket.off('game:round:start', handleRoundStart)
      socket.off('game:voting:start', handleVotingStart)
      ;(socket as any).off('game:answers:update', handleAnswersUpdate)
      ;(socket as any).off('game:votes:update', handleVotesUpdate)
      ;(socket as any).off('game:state:sync', handleGameStateSync)
      socket.off('game:error', handleGameError)
      ;(socket as any).off('game:answer:submitted', handleAnswerSubmitted)
      ;(socket as any).off('game:vote:submitted', handleVoteSubmitted)
    }
  }, [socket, isConnected, roomId])

  const handleSubmitAnswer = () => {
    if (!socket || !userAnswer.trim()) return

    socket.emit('game:answer:submit', {
      roomId,
      roundId: `round-${gameState?.currentRound}`,
      answer: userAnswer.trim()
    })
  }

  const handleSubmitVote = () => {
    if (!socket || !userVote) return

    socket.emit('game:vote:submit', {
      roomId,
      roundId: `round-${gameState?.currentRound}`,
      votedForUserId: userVote
    })
  }

  const getPlayerName = (userId: string) => {
    const player = players?.find(p => p.id === userId)
    return player?.name || player?.email || 'Unknown Player'
  }

  if (!gameState) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Waiting for game to start...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Round {gameState.currentRound} of {gameState.totalRounds}</span>
            <Badge variant={gameState.status === 'question' ? 'default' : 'secondary'}>
              {gameState.status === 'question' ? 'Question Phase' : 
               gameState.status === 'voting' ? 'Voting Phase' : 'Waiting'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-semibold">{gameState.timeRemaining}s</span>
            <Progress value={(gameState.timeRemaining / 30) * 100} className="flex-1" />
          </div>
        </CardContent>
      </Card>

      {/* Question Phase */}
      {gameState.status === 'question' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Question</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{gameState.currentQuestion}</p>
            
            {!hasAnswered ? (
              <div className="space-y-3">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                  disabled={!isConnected}
                />
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim() || !isConnected}
                  className="w-full"
                >
                  Submit Answer
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Answer submitted!</span>
              </div>
            )}

            {/* Live Answers Display */}
            {gameState.answers.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Answers ({gameState.answers.length}/{players.length})</span>
                </h4>
                <div className="space-y-2">
                  {gameState.answers.map((answer, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <span className="font-medium">{getPlayerName(answer.userId)}:</span> {answer.answer}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voting Phase */}
      {gameState.status === 'voting' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Vote className="w-5 h-5" />
              <span>Vote for the Best Answer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasVoted ? (
              <div className="space-y-3">
                <select
                  value={userVote}
                  onChange={(e) => setUserVote(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  disabled={!isConnected}
                >
                  <option value="">Select an answer to vote for...</option>
                  {gameState.answers.map((answer, index) => (
                    <option key={index} value={answer.userId}>
                      {getPlayerName(answer.userId)}: {answer.answer}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleSubmitVote}
                  disabled={!userVote || !isConnected}
                  className="w-full"
                >
                  Submit Vote
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Vote submitted!</span>
              </div>
            )}

            {/* Live Votes Display */}
            {gameState.votes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Vote className="w-4 h-4" />
                  <span>Votes ({gameState.votes.length}/{players.length})</span>
                </h4>
                <div className="space-y-2">
                  {gameState.votes.map((vote, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <span className="font-medium">{getPlayerName(vote.userId)}</span> voted for{' '}
                      <span className="font-medium">{getPlayerName(vote.votedForUserId)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Finished */}
      {gameState.status === 'finished' && (
        <Card>
          <CardHeader>
            <CardTitle>Game Finished!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-lg">Congratulations! The game has ended.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
