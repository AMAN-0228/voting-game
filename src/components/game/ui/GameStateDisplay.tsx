'use client'

import { useEffect, useState } from 'react'
import { useSocketConnection } from '@/hooks/socket-hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GameState {
  status: string
  currentRound?: {
    id: string
    roundNumber: number
    question: string
    timeLimit: number
  }
  scores?: Array<{ userId: string; points: number }>
}

interface GameStateDisplayProps {
  roomId: string
}

export function GameStateDisplay({ roomId }: GameStateDisplayProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [answers, setAnswers] = useState<Array<{ id: string; content: string; userId: string }>>([])
  const [votes, setVotes] = useState<Array<{ answerId: string; voteCount: number }>>([])
  const { socket, isConnected } = useWebSocket()

  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for game events
    socket.on('game_started', (data: any) => {
      console.log('Game started:', data)
      setGameState(prev => ({ ...prev, status: 'in_progress' }))
    })

    socket.on('round_started', (data: any) => {
      console.log('Round started:', data)
      setGameState(prev => ({
        ...prev,
        currentRound: {
          id: data.roundId,
          roundNumber: data.roundNumber,
          question: data.question,
          timeLimit: data.timeLimit
        }
      }))
      setAnswers([])
      setVotes([])
    })

    socket.on('round_voting_started', (data: any) => {
      console.log('Voting started:', data)
      setAnswers(data.answers)
    })

    socket.on('vote_update', (data: any) => {
      console.log('Vote update:', data)
      setVotes(prev => {
        const newVotes = [...prev]
        const existingIndex = newVotes.findIndex(v => v.answerId === data.answerId)
        if (existingIndex >= 0) {
          newVotes[existingIndex] = { answerId: data.answerId, voteCount: data.voteCount }
        } else {
          newVotes.push({ answerId: data.answerId, voteCount: data.voteCount })
        }
        return newVotes
      })
    })

    socket.on('round_ended', (data: any) => {
      console.log('Round ended:', data)
      setGameState(prev => ({ ...prev, currentRound: undefined }))
    })

    socket.on('game_over', (data: any) => {
      console.log('Game over:', data)
      setGameState(prev => ({ ...prev, status: 'done' }))
    })

    socket.on('scores_updated', (data: any) => {
      console.log('Scores updated:', data)
      setGameState(prev => ({ ...prev, scores: data.scores }))
    })

    // Sync game state
    socket.emit('sync_game_state', { roomId })

    return () => {
      socket.off('game_started')
      socket.off('round_started')
      socket.off('round_voting_started')
      socket.off('vote_update')
      socket.off('round_ended')
      socket.off('game_over')
      socket.off('scores_updated')
    }
  }, [socket, isConnected, roomId])

  if (!gameState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game State</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading game state...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={gameState.status === 'in_progress' ? 'default' : 'secondary'}>
            {gameState.status}
          </Badge>
        </CardContent>
      </Card>

      {gameState.currentRound && (
        <Card>
          <CardHeader>
            <CardTitle>Round {gameState.currentRound.roundNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{gameState.currentRound.question}</p>
            <p className="text-sm text-gray-600">
              Time remaining: {gameState.currentRound.timeLimit}s
            </p>
          </CardContent>
        </Card>
      )}

      {answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {answers.map((answer) => (
                <div key={answer.id} className="p-3 border rounded">
                  <p className="font-medium">User {answer.userId}</p>
                  <p>{answer.content}</p>
                  {votes.find(v => v.answerId === answer.id) && (
                    <Badge variant="outline" className="mt-2">
                      {votes.find(v => v.answerId === answer.id)?.voteCount || 0} votes
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {gameState.scores && gameState.scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameState.scores.map((score) => (
                <div key={score.userId} className="flex justify-between items-center">
                  <span>User {score.userId}</span>
                  <Badge variant="default">{score.points} points</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
