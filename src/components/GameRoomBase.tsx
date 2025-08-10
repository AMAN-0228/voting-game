'use client'

import { useSession } from 'next-auth/react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useGameStore } from '@/store/game-store'
import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnswerForm } from './AnswerForm'
import { VotingPanel } from './VotingPanel'
import { ScoreBoard } from './ScoreBoard'
import { PlayersList } from './PlayersList'
import { Timer } from './Timer'
import { 
  Gamepad2, 
  Users, 
  Crown, 
  Play, 
  LogOut, 
  Trophy, 
  Target,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface GameRoomBaseProps {
  roomId: string
  isLoading: boolean
  error: string | null
  isJoining: boolean
  refetch: () => void
}

export const GameRoomBase = ({ 
  roomId, 
  isLoading, 
  error, 
  isJoining, 
  refetch 
}: GameRoomBaseProps) => {
  const { data: session } = useSession()
  const { 
    leaveRoom, 
    startGame, 
    endGame, 
    isConnected, 
    connectionError 
  } = useWebSocket()
  
  const { 
    currentRound, 
    gamePhase, 
    scores, 
    hasSubmittedAnswer, 
    hasVoted,
    playersOnline 
  } = useGameStore()
  
  const { 
    currentRoom, 
    isHost, 
    isInRoom
  } = useRoomStore()

  // Connection status
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Connecting to Game Server</h2>
              <p className="text-gray-600 mb-4">Establishing real-time connection...</p>
              {connectionError && (
                <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{connectionError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading or error state
  if (isLoading || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              {isLoading ? (
                <>
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Room</h2>
                  <p className="text-gray-600">Preparing your gaming experience...</p>
                </>
              ) : error ? (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Room</h2>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <Button 
                    onClick={refetch} 
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Joining room state
  if (isJoining || !isInRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Joining Room</h2>
              <p className="text-gray-600">Getting ready to play...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:60px_60px] opacity-40"></div>
      
      <main className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Room Header */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      Room: {currentRoom?.code}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {currentRoom?.status?.replace('_', ' ').toUpperCase() || 'STARTING'}
                      </Badge>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                        <Users className="w-3 h-3 mr-1" />
                        {playersOnline.length} players online
                      </Badge>
                      {isHost && (
                        <Badge variant="destructive" className="bg-yellow-500 text-yellow-900 border-yellow-400">
                          <Crown className="w-3 h-3 mr-1" />
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {isHost && currentRoom?.status === 'starting' && (
                    <Button 
                      onClick={startGame} 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Game
                    </Button>
                  )}
                  {isHost && currentRoom?.status === 'in_progress' && (
                    <Button 
                      onClick={endGame} 
                      variant="destructive"
                      size="lg"
                      className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      End Game
                    </Button>
                  )}
                  <Button 
                    onClick={leaveRoom} 
                    variant="outline" 
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Room
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Game Area */}
            <div className="xl:col-span-3 space-y-6">
              {/* Game Phase Display */}
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-indigo-600" />
                      Game Phase
                    </span>
                    <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                      {gamePhase.type.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {gamePhase.timeLeft && gamePhase.totalTime && (
                    <Timer timeLeft={gamePhase.timeLeft} totalTime={gamePhase.totalTime} />
                  )}
                </CardContent>
              </Card>

              {/* Current Question */}
              {currentRound && (
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Target className="w-6 h-6 text-emerald-600" />
                      Current Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-xl font-medium text-gray-800 leading-relaxed">
                      {currentRound.question}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Game Content Based on Phase */}
              {gamePhase.type === 'waiting' && (
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gamepad2 className="w-12 h-12 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">Waiting for Game to Start</h3>
                      <p className="text-gray-600 text-lg max-w-md mx-auto">
                        {isHost 
                          ? "Click 'Start Game' when all players are ready!" 
                          : "Waiting for the host to start the game..."
                        }
                      </p>
                      {isHost && (
                        <div className="mt-6">
                          <Button 
                            onClick={startGame} 
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Start Game
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {gamePhase.type === 'answering' && currentRound && (
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                      Submit Your Answer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AnswerForm 
                      roundId={currentRound.id}
                      hasSubmitted={hasSubmittedAnswer}
                      timeLeft={gamePhase.timeLeft}
                    />
                  </CardContent>
                </Card>
              )}

              {gamePhase.type === 'voting' && currentRound && (
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Target className="w-6 h-6 text-orange-600" />
                      Vote for the Best Answer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <VotingPanel 
                      round={currentRound}
                      hasVoted={hasVoted}
                      timeLeft={gamePhase.timeLeft}
                    />
                  </CardContent>
                </Card>
              )}

              {gamePhase.type === 'results' && (
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                      Round Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ScoreBoard scores={scores} />
                  </CardContent>
                </Card>
              )}

              {gamePhase.type === 'finished' && (
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Trophy className="w-16 h-16 text-yellow-600" />
                      </div>
                      <h3 className="text-4xl font-bold text-gray-800 mb-6">Game Finished!</h3>
                      <div className="max-w-2xl mx-auto">
                        <ScoreBoard scores={scores} showFinal={true} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <PlayersList 
                players={currentRoom?.players || []} 
                onlinePlayers={playersOnline}
                hostId={currentRoom?.hostId}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
