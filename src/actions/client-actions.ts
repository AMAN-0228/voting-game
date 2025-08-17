import { API_ROUTES } from '@/constants/api-routes'
import { Socket } from 'socket.io-client'

/**
 * Start a new game
 */
export async function startGame(roomId: string, numRounds: number = 3) {
  const response = await fetch(API_ROUTES.GAME_MANAGEMENT.START(roomId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ numRounds })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to start game')
  }

  return response.json()
}

/**
 * Submit an answer with acknowledgment
 */
export async function submitAnswerWithAck(socket: Socket, roundId: string, content: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    socket.emit('answer_submitted', { roundId, content }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) {
        resolve({ ok: false, error: res?.error || 'Answer failed' })
        return
      }
      resolve({ ok: true })
    })
  })
}

/**
 * Submit a vote with acknowledgment
 */
export async function submitVoteWithAck(socket: Socket, roundId: string, answerId: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    socket.emit('vote_submitted', { roundId, answerId }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) {
        resolve({ ok: false, error: res?.error || 'Vote failed' })
        return
      }
      resolve({ ok: true })
    })
  })
}

/**
 * Sync game state with acknowledgment
 */
export async function syncGameStateWithAck(socket: Socket, roomId: string): Promise<{
  ok: boolean
  error?: string
  data?: {
    room: any
    isHost: boolean
    currentRound: any
    scores: any[]
    gamePhase: string
    timeLeft: number
    playersOnline: string[]
  }
}> {
  return new Promise((resolve) => {
    socket.emit('sync_game_state', { roomId }, (res: {
      ok: boolean
      error?: string
      data?: any
    }) => {
      if (!res?.ok) {
        resolve({ ok: false, error: res?.error || 'Sync failed' })
        return
      }
      resolve({ ok: true, data: res.data })
    })
  })
}
