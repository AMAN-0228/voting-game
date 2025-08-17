export interface Player {
  id: string
  username: string
  score: number
  isReady: boolean
  isHost: boolean
  currentAnswer?: string
  hasVoted: boolean
}

export interface GameState {
  roomId: string
  roundId: string
  phase: 'lobby' | 'answering' | 'voting' | 'results'
  players: Player[]
  scores: Record<string, number>
  timeLeft?: number
  roundNumber: number
  totalRounds: number
}
