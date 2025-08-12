'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePersistentSocket } from '@/hooks/socket-hooks'
import { useGameStore } from '@/store/game-store'
import { useWebSocketStore } from '@/store/websocket-store'
import { toast } from 'sonner'

interface AnswerSubmissionProps {
  roomId: string
  roundId: string
  question: string
  timeLimit: number
}

export function AnswerSubmission({ roomId, roundId, question, timeLimit }: AnswerSubmissionProps) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { socket } = usePersistentSocket()
  const { gamePhase, setUserAnswer, setHasSubmittedAnswer } = useGameStore()
  const { submitAnswer } = useWebSocketStore()
  
  // Use game phase's timeLeft instead of local state
  const timeLeft = gamePhase.timeLeft ?? timeLimit

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please enter an answer')
      return
    }

    if (!socket) {
      toast.error('Not connected to server')
      return
    }

    setIsSubmitting(true)
    try {
      submitAnswer(roundId, answer.trim())
      setUserAnswer(answer.trim())
      setHasSubmittedAnswer(true)
      setAnswer('')
      toast.success('Answer submitted successfully!')
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (timeLeft <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time's Up!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Answering phase has ended. Waiting for voting to begin...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Answer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 font-medium">Question:</p>
          <p className="text-gray-700">{question}</p>
        </div>
        
        <div>
          <p className="mb-2 font-medium">Time Remaining: {timeLeft}s</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <Input
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitting}
            maxLength={200}
          />
        </div>

        <Button
          onClick={handleSubmitAnswer}
          disabled={isSubmitting || !answer.trim()}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </CardContent>
    </Card>
  )
}
