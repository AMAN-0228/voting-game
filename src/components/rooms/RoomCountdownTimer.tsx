'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, ArrowRight } from 'lucide-react'

interface RoomCountdownTimerProps {
  roomId: string
  onTimeout?: () => void
}

export function RoomCountdownTimer({ roomId, onTimeout }: RoomCountdownTimerProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(30)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsRedirecting(true)
      onTimeout?.()
      // Auto-redirect to lobby after 30 seconds
      router.push(`/room/${roomId}/lobby`)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, roomId, router, onTimeout])

  const handleGoToLobby = () => {
    setIsRedirecting(true)
    router.push(`/room/${roomId}/lobby`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = () => {
    if (timeLeft > 20) return 'text-green-600'
    if (timeLeft > 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Timer Icon and Title */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Auto-redirect to Lobby</h3>
              <p className="text-sm text-gray-600">You'll be redirected automatically</p>
            </div>
          </div>

          {/* Countdown Display */}
          <div className="space-y-2">
            <div className={`text-4xl font-bold ${getProgressColor()} font-mono`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500">
              {timeLeft > 0 ? 'Redirecting in...' : 'Redirecting now...'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeLeft > 20 ? 'bg-green-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>

          {/* Manual Lobby Button */}
          <Button
            onClick={handleGoToLobby}
            disabled={isRedirecting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            size="lg"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {isRedirecting ? 'Redirecting...' : 'Lobby →'}
          </Button>

          {/* Info Text */}
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You're already a member of this room. Click the button above to go to the lobby immediately, or wait for the automatic redirect.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
