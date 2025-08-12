'use client'

import { useState } from 'react'
import { useSocketConnection } from '@/hooks/socket-hooks'
import { useSession } from 'next-auth/react'
import { Round, Answer } from '@/store/game-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Target, Clock, CheckCircle, Vote, Users, Loader2, AlertCircle, Star, Sparkles, Trophy, Heart } from 'lucide-react'

interface VotingPanelProps {
  round: Round
  hasVoted: boolean
  timeLeft?: number
}

export const VotingPanel = ({ round, hasVoted, timeLeft }: VotingPanelProps) => {
  const { data: session } = useSession()
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const { submitVote, isConnected } = useWebSocket()

  // Filter out user's own answer (can't vote for yourself)
  const votableAnswers = round.answers.filter(answer => answer.userId !== session?.user?.id)

  const handleVote = async (answerId: string) => {
    if (!isConnected) {
      toast.error('Not connected to server. Please wait...')
      return
    }
    if (hasVoted || isVoting) return

    setIsVoting(true)
    try {
      submitVote(round.id, answerId)
      setSelectedAnswerId(answerId)
      toast.success('Vote submitted successfully!')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    } finally {
      setIsVoting(false)
    }
  }

  if (hasVoted) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <Badge variant="default" className="text-lg px-4 py-2 mb-4 bg-green-600 text-white border-0">
              ✓ Vote Submitted
            </Badge>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Vote recorded!</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Waiting for other players to vote...
            </p>
            {timeLeft && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Time remaining: {timeLeft}s</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (votableAnswers.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">No Answers Available</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              No answers available to vote on yet. Please wait for other players to submit their answers.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="flex items-center gap-3">
            <Target className="w-6 h-6 text-orange-600" />
            Vote for the Best Answer
          </span>
          {timeLeft && (
            <Badge 
              variant={timeLeft < 10 ? 'destructive' : 'secondary'}
              className={`text-sm px-3 py-1 ${
                timeLeft < 10 
                  ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' 
                  : 'bg-orange-100 text-orange-700 border-orange-200'
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {timeLeft}s left
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Voting Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 text-blue-700 mb-2">
              <Vote className="w-5 h-5" />
              <span className="font-semibold">Voting Instructions</span>
            </div>
            <p className="text-blue-600 text-sm leading-relaxed">
              Choose the answer you think is the most creative, funny, or clever! You cannot vote for your own answer. 
              Consider originality, humor, and how well it fits the question.
            </p>
          </div>
          
          {/* Answer Cards */}
          <div className="space-y-4">
            {votableAnswers.map((answer, index) => {
              const isSelected = selectedAnswerId === answer.id
              const hasVotes = answer.votes && answer.votes.length > 0
              const voteCount = answer.votes?.length || 0
              
              return (
                <Card 
                  key={answer.id} 
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                    isSelected 
                      ? 'ring-2 ring-purple-500 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg' 
                      : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                  }`}
                  onClick={() => !isVoting && isConnected && handleVote(answer.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Answer Header */}
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isSelected 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Answer {index + 1}
                          </Badge>
                          
                          {hasVotes && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                              <Users className="w-3 h-3 mr-1" />
                              {voteCount} vote{voteCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          
                          {isSelected && (
                            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                              <Heart className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        
                        {/* Answer Content */}
                        <div className="bg-white rounded-lg p-4 border border-gray-100">
                          <p className="text-lg text-gray-800 leading-relaxed font-medium">
                            "{answer.content}"
                          </p>
                        </div>
                        
                        {/* Answer Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>Creative answer</span>
                          </div>
                          {hasVotes && (
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-purple-500" />
                              <span>Popular choice</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Vote Button */}
                      <div className="flex flex-col items-center gap-3">
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          disabled={isVoting || !isConnected}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(answer.id)
                          }}
                          className={`${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                              : 'border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300'
                          } shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-w-[100px]`}
                        >
                          {isVoting && isSelected ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Voting...
                            </>
                          ) : (
                            <>
                              <Vote className="w-4 h-4 mr-2" />
                              {isSelected ? 'Voted' : 'Vote'}
                            </>
                          )}
                        </Button>
                        
                        {/* Vote Count Display */}
                        {hasVotes && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{voteCount}</div>
                            <div className="text-xs text-gray-500">votes</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {/* Voting Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-700 mb-2">
              <Target className="w-4 h-4" />
              <span className="font-semibold">Voting Tips:</span>
            </div>
            <ul className="text-purple-600 text-sm space-y-1">
              <li>• Vote for answers that make you laugh or think</li>
              <li>• Consider creativity and originality</li>
              <li>• Don't just vote for the first answer you see</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
