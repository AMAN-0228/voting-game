'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, AlertTriangle, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TimerProps {
  timeLeft: number
  totalTime: number
  label?: string
}

export const Timer = ({ timeLeft, totalTime, label = 'Time Remaining' }: TimerProps) => {
  const [timeLeftState, setTimeLeftState] = useState(timeLeft)
  const pct = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100))
  const isLow = timeLeft <= Math.max(5, Math.floor(totalTime * 0.15))
  const isCritical = timeLeft <= 10
  const isWarning = timeLeft <= Math.floor(totalTime * 0.3)

  const getTimeColor = () => {
    if (isCritical) return 'text-red-600'
    if (isWarning) return 'text-orange-600'
    return 'text-blue-600'
  }

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500'
    if (isWarning) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const getIcon = () => {
    if (isCritical) return <Zap className="w-4 h-4 animate-pulse" />
    if (isWarning) return <AlertTriangle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    // to have a countdown timer
    if (timeLeftState <= 0) return
    const interval = setInterval(() => {
      setTimeLeftState(prev => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeftState])
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <Badge 
          variant={isCritical ? 'destructive' : isWarning ? 'default' : 'secondary'}
          className={`${
            isCritical 
              ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' 
              : isWarning 
              ? 'bg-orange-100 text-orange-700 border-orange-200' 
              : 'bg-blue-100 text-blue-700 border-blue-200'
          } text-sm px-3 py-1 font-mono`}
        >
          {formatTime(timeLeftState)}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={pct} 
          className={`h-3 transition-all duration-300 ${
            isCritical ? 'animate-pulse' : ''
          }`}
          style={{
            '--progress-color': isCritical ? '#ef4444' : isWarning ? '#f97316' : '#3b82f6'
          } as React.CSSProperties}
        />
        
        {/* Time Indicators */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0s</span>
          <span className="text-center">
            {isCritical && (
              <span className="text-red-500 font-semibold animate-pulse">
                ⚠️ Time's running out!
              </span>
            )}
            {isWarning && !isCritical && (
              <span className="text-orange-500 font-medium">
                ⏰ Hurry up!
              </span>
            )}
          </span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>

      {/* Visual Time Representation */}
      {isCritical && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-red-700">
            <Zap className="w-4 h-4 animate-bounce" />
            <span className="text-sm font-medium">Critical Time Remaining!</span>
            <Zap className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      )}

      {/* Time Progress Rings */}
      <div className="flex justify-center">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            {/* Progress Circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={isCritical ? '#ef4444' : isWarning ? '#f97316' : '#3b82f6'}
              strokeWidth="2"
              strokeDasharray={`${pct * 1.131}, 100`}
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${getTimeColor()}`}>
              {formatTime(timeLeftState)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
