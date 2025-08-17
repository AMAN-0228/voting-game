'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Trophy, Vote, MessageSquare } from 'lucide-react'
import { AnswerListing } from './AnswerListing'
import { toast } from 'sonner'
import { useSessionContext } from '@/components/layout/SessionProvider'
import { useRoom } from '@/hooks/useRoom'
import { RoundHeader } from './RoundHeader'
import { useRoomStore } from '@/store/room-store'

interface RoundSummaryProps {
  roomId: string
}

interface Answer {
  id: string
  content: string
  userId: string
  userName: string
  voteCount: number
  voters: Array<{
    id: string
    name: string
  }>
}

interface UserVote {
  answerId: string
  answerContent: string
  votedForUser: string
}

interface Round {
  id: string
  sno: number
  question: string
  status: string
  createdAt: string
  answers: Answer[]
  winningAnswer: Answer | null
  winningAnswerIds: string[] | []
  userVote: UserVote | null
  totalVotes: number
}

export function RoundSummary({ roomId }: RoundSummaryProps) {
  const { user } = useSessionContext()
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())
  
  // Get round summary data from useRoom hook
  const { 
    fetchRoundSummary,
    isRoundSummaryLoading: loading, 
    roundSummaryError: error
  } = useRoom(roomId, { autoJoin: false })

  // Get rounds from store since useRoom doesn't return them directly
  const { roundSummary: rounds } = useRoomStore()

  useEffect(() => {
    if (roomId) {
      fetchRoundSummary()
    }
  }, [roomId, fetchRoundSummary])

  useEffect(() => {
    // Expand the first round by default when data loads
    if (rounds && rounds.length > 0) {
      setExpandedRounds(new Set([rounds[0].id]))
    }
  }, [rounds])

  const toggleRound = (roundId: string) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(roundId)) {
      newExpanded.delete(roundId)
    } else {
      newExpanded.add(roundId)
    }
    setExpandedRounds(newExpanded)
  }

 

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Round Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Round Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchRoundSummary()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!rounds || rounds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Round Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No rounds found for this game.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Round Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rounds?.filter((round) => round.status === 'finished')?.map((round) => (
            <div key={round.id} className="border rounded-lg overflow-hidden">
              {/* Round Header - Always Visible */}
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleRound(round.id)}
              >
                <RoundHeader 
                   headerFor="summary" 
                   roundId={round.id} 
                   userId={user?.id || ''} 
                   status={round.status} 
                   winnerAnswerIds={round.winningAnswerIds || []} 
                   totalVotes={round.totalVotes} 
                   expandedRounds={expandedRounds} 
                   sno={round.sno}
                   gamePhase={{ type: 'waiting' }}
                   totalRounds={rounds?.length || 0}
                 />
                
                {/* Question - Always Visible */}
                <div className="mt-3">
                  <h4 className="font-medium text-gray-900">{round.question}</h4>
                </div>
              </div>

              {/* Expandable Content */}
              {expandedRounds.has(round.id) && (
                <div className="p-4 border-t bg-white">
                  {/* User's Vote Section */}
                  {round.userVote && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Vote className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Your Vote</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        You voted for: <span className="font-medium">"{round.userVote.answerContent}"</span>
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Answer by: {round.userVote.votedForUser}
                      </p>
                    </div>
                  )}

                                     {/* Answers Section */}
                   <div className="space-y-3">
                     <h5 className="font-medium text-gray-900 flex items-center gap-2">
                       <MessageSquare className="h-4 w-4" />
                       All Answers
                     </h5>
                     
                     <AnswerListing
                       answers={round.answers}
                       variant="summary"
                       winningAnswerIds={round.winningAnswerIds || []}
                       showVoters={true}
                     />
                   </div>

                  {/* Round Statistics */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Answers:</span>
                        <span className="ml-2 font-medium">{round.answers.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Votes:</span>
                        <span className="ml-2 font-medium">{round.totalVotes}</span>
                      </div>
                      {round.winningAnswer && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Winning Answer:</span>
                          <span className="ml-2 font-medium text-yellow-700">
                            "{round.winningAnswer.content}" by {round.winningAnswer.userName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) || <div className="text-center py-8">
            <p className="text-gray-600">No rounds found for this game which are finished.</p>
          </div>}
        </div>
      </CardContent>
    </Card>
  )
}
