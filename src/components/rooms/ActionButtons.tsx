import { Loader2, Play, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  canJoin: boolean
  isJoining: boolean
  handleJoinRoom: () => void
  isConnected: boolean
  isConnecting: boolean
  isInRoom: boolean
  onGoLobby: () => void
}

export function ActionButtons({
  canJoin,
  isJoining,
  handleJoinRoom,
  isConnected,
  isConnecting,
  isInRoom,
  onGoLobby,
}: ActionButtonsProps) {
  return (
    <>
      <div className="pt-6 text-center space-y-4">
        <Button
          onClick={handleJoinRoom}
          disabled={!canJoin || isJoining}
          size="lg"
          className="w-full md:w-auto px-12 py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          {isJoining ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
              Joining Room...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-3" />
              Join Room
            </>
          )}
        </Button>

        {!isConnected && (
          <p className="text-sm text-gray-500">
            {isConnecting ? 'Connecting to room...' : 'Please wait for connection to join'}
          </p>
        )}
      </div>

      {isInRoom && (
        <div className="pt-6 text-center">
          <Button
            onClick={onGoLobby}
            variant="outline"
            size="lg"
            className="w-full md:w-auto px-12 py-6 text-lg font-bold border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
          >
            <Gamepad2 className="w-5 h-5 mr-3" />
            Go to Lobby
          </Button>
        </div>
      )}
    </>
  )
}
