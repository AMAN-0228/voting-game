'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePersistentSocket } from '@/hooks/socket-hooks'
import { useGameStore } from '@/store/game-store'
import { useWebSocketStore } from '@/store/websocket-store'
import { toast } from 'sonner'

interface VotingInterfaceProps {
  roomId: string
  roundId: string
  answers: Array<{
    id: string
    content: string
    userId: string
    votes: Array<{ id: string; voterId: string }>
  }>
  timeLimit: number
}

export function VotingInterface({ roomId, roundId, answers, timeLimit }: VotingInterfaceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const { socket } = usePersistentSocket()
  const { gamePhase, setVotedAnswerId } = useGameStore()
  const { submitVote } = useWebSocketStore()
  // Use game phase's timeLeft instead of local state
  const timeLeft = gamePhase.timeLeft ?? timeLimit

  const handleVote = async () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer to vote for')
      return
    }

    if (!socket) {
      toast.error('Not connected to server')
      return
    }

    setIsVoting(true)
    try {
      submitVote(roundId, selectedAnswer)
      setVotedAnswerId(selectedAnswer)
      setSelectedAnswer(null)
      toast.success('Vote submitted successfully!')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit vote')
    } finally {
      setIsVoting(false)
    }
  }

  if (timeLeft <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voting Ended</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Voting phase has ended. Calculating results...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote for Your Favorite Answer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 font-medium">Time Remaining: {timeLeft}s</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {answers.map((answer) => {
            const voteCount = answer.votes?.length || 0
            const isSelected = selectedAnswer === answer.id
            
            return (
              <div
                key={answer.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAnswer(answer.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm text-gray-600">
                    User {answer.userId}
                  </p>
                  <Badge variant="outline">{voteCount} votes</Badge>
                </div>
                <p className="text-gray-800">{answer.content}</p>
                {isSelected && (
                  <div className="mt-2">
                    <Badge variant="default">Selected</Badge>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Button
          onClick={handleVote}
          disabled={isVoting || !selectedAnswer}
          className="w-full"
        >
          {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
        </Button>
      </CardContent>
    </Card>
  )
}
