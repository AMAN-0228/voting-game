import { Badge } from "@/components/ui/badge"
import { GamePhase } from "@/store/game-store"
import { GamePhaseHeader } from "./GamePhaseHeader"
import { ChevronDown, ChevronRight, Trophy, Vote, User, MessageSquare } from 'lucide-react'

export const RoundHeader = ({ headerFor, roundId, userId, status, winnerAnswerIds, totalVotes, expandedRounds, gamePhase, sno = 0, totalRounds }: { headerFor: string, roundId: string, userId: string, status: string, winnerAnswerIds: string[], totalVotes: number, expandedRounds: any, gamePhase: GamePhase, sno: number, totalRounds: number }) => {
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'active':
        return 'default'
      case 'voting':
        return 'outline'
      case 'finished':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if ( headerFor === 'game') { 
    return (
      <GamePhaseHeader gamePhase={gamePhase} roundSno={sno} totalRounds={totalRounds} />
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="font-semibold">
          Round {sno}
        </Badge>
        <Badge variant="default" className="bg-blue-500 text-white">
          {getStatusText(status)}
        </Badge>
        {winnerAnswerIds && winnerAnswerIds.includes(userId) && (
          <Badge variant="default" className="bg-yellow-500 text-white">
            <Trophy className="h-3 w-3 mr-1" />
            Winner
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {totalVotes} votes
        </span>
        {expandedRounds.has(roundId) ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>
    </div>
  )
}