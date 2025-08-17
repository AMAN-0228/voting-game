'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Score } from '@/store/game-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Star, TrendingUp, Users } from 'lucide-react'

interface ScoreBoardProps {
  scores: Score[]
  showFinal?: boolean
}

export const ScoreBoard = ({ scores, showFinal = false }: ScoreBoardProps) => {
  const { data: session } = useSession()

  const sorted = useMemo(() => {
    const byPoints = [...scores].sort((a, b) => b.points - a.points)
    return byPoints.map((s, idx) => ({ ...s, rank: idx + 1 }))
  }, [scores])

  if (!scores || scores.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Scores Yet</h3>
            <p className="text-gray-600">Play a round to see the leaderboard!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const top = sorted[0]
  const totalPlayers = scores.length

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            {showFinal ? 'Final Results' : 'Round Leaderboard'}
          </span>
          {showFinal && (
            <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              Game Over
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Top 3 Podium */}
        {sorted.length >= 3 && (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-4 mb-6">
              {/* 2nd Place */}
              {sorted[1] && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Medal className="w-8 h-8 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 min-w-[120px]">
                    <p className="font-semibold text-gray-800 text-sm mb-1">
                      {sorted[1].user?.name || sorted[1].user?.email || 'Player'}
                    </p>
                    <Badge variant="secondary" className="bg-gray-200 text-gray-700 border-0">
                      {sorted[1].points} pts
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* 1st Place */}
              {top && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 min-w-[140px] border-2 border-yellow-200">
                    <p className="font-bold text-gray-800 text-lg mb-2">
                      {top.user?.name || top.user?.email || 'Player'}
                    </p>
                    <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-base">
                      🏆 {top.points} pts
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* 3rd Place */}
              {sorted[2] && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Medal className="w-8 h-8 text-white" />
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 min-w-[120px]">
                    <p className="font-semibold text-gray-800 text-sm mb-1">
                      {sorted[2].user?.name || sorted[2].user?.email || 'Player'}
                    </p>
                    <Badge variant="secondary" className="bg-amber-200 text-amber-800 border-0">
                      {sorted[2].points} pts
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{totalPlayers}</div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Players</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{top.points}</div>
                <div className="text-xs text-green-600 uppercase tracking-wide">Top Score</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(scores.reduce((sum, s) => sum + s.points, 0) / totalPlayers)}
                </div>
                <div className="text-xs text-purple-600 uppercase tracking-wide">Avg Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-4">
            <Users className="w-4 h-4" />
            Complete Leaderboard
          </div>
          
          {sorted.map((score, index) => {
            const isSelf = score.userId === session?.user?.id
            const isTop3 = index < 3
            
            return (
              <div
                key={score.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                  isSelf 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                } ${isTop3 ? 'ring-2 ring-yellow-200' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                      : index === 1 
                      ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' 
                      : index === 2 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : score.rank}
                  </div>
                  
                  {/* Player Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${isSelf ? 'text-blue-800' : 'text-gray-800'}`}>
                        {score.user?.name || score.user?.email || 'Player'}
                      </p>
                      {isSelf && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                          You
                        </Badge>
                      )}
                      {isTop3 && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {score.user?.email && (
                      <p className="text-xs text-gray-500">{score.user.email}</p>
                    )}
                  </div>
                </div>
                
                {/* Score */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={index === 0 ? 'default' : 'secondary'} 
                    className={`${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0' 
                        : 'bg-gray-200 text-gray-700 border-0'
                    } text-base px-3 py-1`}
                  >
                    {score.points} pts
                  </Badge>
                  {index === 0 && (
                    <TrendingUp className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
