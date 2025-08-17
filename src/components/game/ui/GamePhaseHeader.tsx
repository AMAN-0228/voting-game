import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GamePhase } from "@/store/game-store"
import { Timer } from "./Timer"

export const GamePhaseHeader = ({ gamePhase, roundSno = 0, totalRounds }: { gamePhase: GamePhase, roundSno: number, totalRounds: number }) => {
  return (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Round {roundSno} of {totalRounds}</span>
            <Badge variant={gamePhase.type === 'answering' ? 'default' : 'secondary'}>
              {gamePhase.type === 'answering' ? 'Question Phase' : 
               gamePhase.type === 'voting' ? 'Voting Phase' : 'Waiting'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* <Clock className="w-5 h-5 text-gray-500" /> */}
            {/* <span className="text-lg font-semibold">{gamePhase.timeLeft || 0}s</span> */}
            {/* <Progress value={((gamePhase.timeLeft || 0) / 30) * 100} className="flex-1" /> */}
            <Timer timeLeft={gamePhase.timeLeft || 0} totalTime={gamePhase.totalTime || 0} />
          </div>
        </CardContent>
      </Card>
  )
}