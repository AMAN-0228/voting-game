import { Server as SocketIOServer } from 'socket.io'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import type { Socket } from 'socket.io'

export interface Timer {
  roomId: string
  roundId: string
  phase: 'answering' | 'voting'
  startTime: number
  totalTime: number
  tickInterval: NodeJS.Timeout
  endTimeout: NodeJS.Timeout
}

export class TimerManager {
  private timers: Map<string, Timer> = new Map() // roomId -> Timer
  private io: SocketIOServer | null = null

  setIO(io: SocketIOServer) {
    this.io = io
  }

  /**
   * Start a new timer for a room/round
   */
  startTimer(params: {
    roomId: string
    roundId: string
    phase: 'answering' | 'voting'
    totalTime: number
    onTick?: (timeLeft: number) => void
    onEnd: () => void
  }) {
    const { roomId, roundId, phase, totalTime, onTick, onEnd } = params

    // Clear any existing timer for this room
    this.clearTimer(roomId)

    // Use server timestamp for initial state
    const startTime = Date.now()
    const initialTimeLeft = totalTime

    // Emit initial state immediately
    if (this.io) {
      this.io.to(roomId).emit(SOCKET_EVENTS.TIMER_TICK, {
        roomId,
        roundId,
        phase,
        timeLeft: initialTimeLeft,
        serverTime: startTime // Send server time for client sync
      })
    }

    const tickInterval = setInterval(() => {
      const timeLeft = this.getTimeLeft(roomId)
      if (timeLeft <= 0) {
        this.clearTimer(roomId)
        return
      }

      // Call onTick if provided
      if (onTick) {
        onTick(timeLeft)
      }

      // Emit timer tick event with server time
      if (this.io) {
        this.io.to(roomId).emit(SOCKET_EVENTS.TIMER_TICK, {
          roomId,
          roundId,
          phase,
          timeLeft,
          serverTime: Date.now() // Include server time for client sync
        })
      }
    }, 10000) // Tick every 10 seconds

    // Set timeout for timer end
    const endTimeout = setTimeout(() => {
      this.clearTimer(roomId)
      onEnd()
    }, totalTime * 1000)

    // Store timer
    this.timers.set(roomId, {
      roomId,
      roundId,
      phase,
      startTime,
      totalTime,
      tickInterval,
      endTimeout
    })

    // Emit initial timer tick
    if (this.io) {
      this.io.to(roomId).emit(SOCKET_EVENTS.TIMER_TICK, {
        roomId,
        roundId,
        phase,
        timeLeft: totalTime
      })
    }
  }

  /**
   * Get time left for a room's timer
   */
  getTimeLeft(roomId: string): number {
    const timer = this.timers.get(roomId)
    if (!timer) return 0

    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000)
    const timeLeft = Math.max(0, timer.totalTime - elapsed)
    return timeLeft
  }

  /**
   * Clear timer for a room
   */
  clearTimer(roomId: string) {
    const timer = this.timers.get(roomId)
    if (timer) {
      clearInterval(timer.tickInterval)
      clearTimeout(timer.endTimeout)
      this.timers.delete(roomId)
    }
  }

  /**
   * Clear all timers (e.g., on server shutdown)
   */
  clearAllTimers() {
    for (const roomId of this.timers.keys()) {
      this.clearTimer(roomId)
    }
  }

  /**
   * Get current timer state for a room
   */
  getTimerState(roomId: string): { phase: 'answering' | 'voting'; timeLeft: number } | null {
    const timer = this.timers.get(roomId)
    if (!timer) return null

    return {
      phase: timer.phase,
      timeLeft: this.getTimeLeft(roomId)
    }
  }
}

// Export singleton instance
export const timerManager = new TimerManager()
