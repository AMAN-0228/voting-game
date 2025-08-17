'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSessionContext } from '@/components/layout'
import { AnswerListing } from './AnswerListing'

interface VotingInterfaceProps {
  hasVoted: boolean
  answers: Array<{
    id: string
    content: string
    userId: string
    votes: Array<{ id: string; voterId: string }>
  }>
  timeLimit: number
  submitVote: (votedAnswerId: string) => void
  votes: Map<string, string[]>
}

export function VotingInterface({ hasVoted, answers, timeLimit, submitVote, votes }: VotingInterfaceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const { user } = useSessionContext()
  // Use game phase's timeLeft instead of local state
  const timeLeft =  timeLimit
  const handleVote = async () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer to vote for')
      return
    }

    setIsVoting(true)
    try {
      submitVote(selectedAnswer)
      toast.success('Vote submitted successfully!')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit vote')
    } finally {
      setIsVoting(false)
    }
  }

  const handleSelectAnswer = (answerId: string) => {
    if (hasVoted) return
    setSelectedAnswer(answerId)
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

        <AnswerListing
          answers={answers.map(answer => ({
            id: answer.id,
            content: answer.content,
            userId: answer.userId,
            userName: answer.userId, // We'll need to get actual user names
            voteCount: votes.get(answer.id)?.length || 0,
            voters: []
          }))}
          variant="voting"
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleSelectAnswer}
          currentUserId={user?.id}
        />
        {hasVoted ? (
          <div className="mt-2 flex justify-center items-center">
            <Badge variant="default" className='bg-green-500 text-white'>Voted</Badge>
          </div>
          ) : (
          <Button
          onClick={handleVote}
          disabled={hasVoted || isVoting || !selectedAnswer}
          className="w-full"
        >
          {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
        </Button>
        )}
      </CardContent>
    </Card>
  )
}
