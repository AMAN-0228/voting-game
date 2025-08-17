'use client'

import React, { useState, useEffect } from 'react'
import { useGameSocket } from '@/hooks/socket-hooks/useGameSocket'
import { useGameStore } from '@/store/game-store'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Users, Vote, MessageSquare, CheckCircle } from 'lucide-react'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import { AnswerForm, AnswerSubmission, GamePhaseHeader, Timer, VotingInterface, VotingPanel } from '@/components/game'

interface GameInterfaceProps {
  roomId: string
  players: Array<{ id: string; name?: string; email?: string }>
}

export default function GameInterface({ roomId, players }: GameInterfaceProps) {
  
  // Get game state from the store
  const gamePhase = useGameStore(state => state.gamePhase)
  const currentRound = useGameStore(state => state.currentRound)
  const rounds = useGameStore(state => state.rounds)
  const scores = useGameStore(state => state.scores)
  const totalRounds = useGameStore(state => state.totalRounds)  
  const hasSubmittedAnswer = useGameStore(state => state.hasSubmittedAnswer)
  const userAnswer = useGameStore(state => state.userAnswer)
  const hasVoted = useGameStore(state => state.hasVoted)
  const votedAnswerId = useGameStore(state => state.votedAnswerId)
  const votes = useGameStore(state => state.votes)
  const { submitAnswer, submitVote, sendForGameStateSync, isConnected } = useGameSocket({roomId})


  useEffect(() => {
    if (isConnected && roomId) {
      sendForGameStateSync(roomId)
    }
  }, [roomId, isConnected, sendForGameStateSync])

  // Use the game socket hook for proper event handling
  
  const handleSubmitAnswer = (answer: string) => {
    if (!answer.trim()) return
    submitAnswer(answer)
  }

  const handleSubmitVote = (answerId: string) => {
    if (!hasVoted) return
    submitVote(answerId)
  }

  const getPlayerName = (userId: string) => {
    const player = players?.find(p => p.id === userId)
    return player?.name || player?.email || 'Unknown Player'
  }

  // Show waiting message only when no rounds are available
  if (!currentRound && gamePhase.type === 'waiting') {
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
      <GamePhaseHeader gamePhase={gamePhase} roundSno={currentRound?.sno || 0} totalRounds={totalRounds || 0} />

      {/* Question Phase */}
      {gamePhase.type === 'answering' && currentRound && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Question</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{currentRound?.question}</p>
            <AnswerForm
              userAnswer={userAnswer}
              hasSubmitted={hasSubmittedAnswer}
              timeLeft={gamePhase.timeLeft}
              handleSubmitAnswer={handleSubmitAnswer}
            />         

            {/* Live Answers Display */}
            {currentRound.answers?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Answers ({currentRound.answers.length}/{players.length})</span>
                </h4>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voting Phase */}
      {gamePhase.type === 'voting' && currentRound && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Vote className="w-5 h-5" />
              <span>Vote for the Best Answer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <VotingInterface
              hasVoted={hasVoted}
              submitVote={submitVote}
              answers={currentRound.answers}
              timeLimit={gamePhase.timeLeft || 0}
              votes={votes}
            />

            {/* Live Votes Display */}
            {/* {currentRound.votes?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Vote className="w-4 h-4" />
                  <span>Votes ({currentRound.votes.length}/{players.length})</span>
                </h4>
                <div className="space-y-2">
                  {currentRound.votes.map((vote, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <span className="font-medium">{getPlayerName(vote.voterId)}</span> voted for{' '}
                      <span className="font-medium">{getPlayerName(vote.answerId)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
