import { Gamepad2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface GameSettingsCardProps {
  numRounds: number
  roundTime: number
}

export function GameSettingsCard({ numRounds, roundTime }: GameSettingsCardProps) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm text-orange-600 font-medium uppercase tracking-wider">Game Settings</div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Rounds:</span>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
            {numRounds}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Time per round:</span>
          <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
            {roundTime}s
          </Badge>
        </div>
      </div>
    </div>
  )
}
