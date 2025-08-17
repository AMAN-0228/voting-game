'use client'

import { Badge } from '@/components/ui/badge'
import { Trophy, User } from 'lucide-react'

interface Voter {
  id: string
  name: string
}

interface Answer {
  id: string
  content: string
  userId: string
  userName: string
  voteCount: number
  voters?: Voter[]
}

interface AnswerListingProps {
  answers: Answer[]
  variant: 'voting' | 'summary'
  selectedAnswer?: string | null
  winningAnswerIds?: string[] | null
  onAnswerSelect?: (answerId: string) => void
  showVoters?: boolean
  currentUserId?: string
}

export function AnswerListing({
  answers,
  variant,
  selectedAnswer,
  winningAnswerIds,
  onAnswerSelect,
  showVoters = false,
  currentUserId
}: AnswerListingProps) {
  const isVoting = variant === 'voting'
  const isSummary = variant === 'summary'

  // Filter out current user's answer in voting mode
  const displayAnswers = isVoting 
    ? answers.filter(answer => answer.userId !== currentUserId)
    : answers

  const getAnswerStyles = (answerId: string) => {
    if (isVoting) {
      return `p-4 border rounded-lg cursor-pointer transition-all ${
        selectedAnswer === answerId
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`
    }

    if (isSummary) {
      return `p-3 border rounded-lg ${
        winningAnswerIds?.includes(answerId)
          ? 'border-yellow-300 bg-yellow-50'
          : 'border-gray-200'
      }`
    }

    return 'p-3 border border-gray-200 rounded-lg'
  }

  const handleAnswerClick = (answerId: string) => {
    if (isVoting && onAnswerSelect) {
      onAnswerSelect(answerId)
    }
  }

  return (
    <div className="space-y-3">
      {displayAnswers.length > 0 ? displayAnswers.map((answer, index) => (
        <div
          key={answer.id}
          className={getAnswerStyles(answer.id)}
          onClick={() => handleAnswerClick(answer.id)}
        >
          {/* Header with answer number and badges */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Answer {index + 1}
              </span>
              
              {/* Winner badge for summary view */}
              {isSummary && winningAnswerIds?.includes(answer.id) && (
                <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  Winner
                </Badge>
              )}
              
              {/* Selected badge for voting view */}
              {isVoting && selectedAnswer === answer.id && (
                <Badge variant="default">Selected</Badge>
              )}
            </div>
            
            {/* Vote count badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {answer.voteCount} votes
              </Badge>
            </div>
          </div>
          
          {/* Answer content */}
          <p className="text-gray-800 mb-2">{answer.content}</p>
          
          {/* User info */}
          {
            isSummary && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <User className="h-3 w-3" />
                <span>{answer.userName}</span>
              </div>
            )
          }
          

          {/* Voters list for summary view */}
          {isSummary && showVoters && answer.voters && answer.voters.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Voted by:</p>
              <div className="flex flex-wrap gap-1">
                {answer.voters.map((voter) => (
                  <Badge key={voter.id} variant="secondary" className="text-xs">
                    {voter.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )) :(
        <div className="text-center py-8">
          <p className="text-gray-600">No answers found for this round.</p>
        </div>
      )}
    </div>
  )
}
