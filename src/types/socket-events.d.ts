// Timer phases
export type TimerPhase = 'answering' | 'voting'

// Game Phase Types
export type GamePhase = 'lobby' | 'answering' | 'voting' | 'results'
export type RoundStatus = 'pending' | 'active' | 'voting' | 'finished'
export type RoomStatus = 'starting' | 'in_progress' | 'done'

// Room Events
export interface RoomEvents {
  'room:join': (data: { roomId: string; userId: string; userName: string }) => void
  'room:leave': (data: { roomId: string; userId: string }) => void
  'room:update': (data: { 
    roomId: string
    status: RoomStatus
    players: Player[]
    hostId: string 
  }) => void
  'room:sync': (data: { 
    roomId: string
    status: RoomStatus
    players: Player[]
    hostId: string 
  }) => void
  'roomData': (data: { 
    roomId: string
    status: RoomStatus
    players: Player[]
    hostId: string 
  }) => void
  'room:error': (data: { message: string }) => void
  'room:status:update': (data: { status: string }) => void
}

// Game Events
export interface GameEvents {
  // Game Lifecycle
  'game:start': (data: { 
    roomId: string
    totalRounds: number
    rounds: Array<{ id: string; roundNumber: number }>
  }) => void
  'game:end': (data: { 
    roomId: string
    finalScores: Array<{
      userId: string
      points: number
      user?: { name?: string; email: string }
    }>
  }) => void

  // Round Lifecycle
  'game:round:start': (data: { 
    roomId: string
    roundId: string
    roundNumber: number
    question: string
    timeLeft: number
    timeTotal: number
  }) => void
  'game:round:end': (data: { 
    roomId: string
    roundId: string
    scores: Record<string, number>
  }) => void

  // Answering Phase
  'game:answering:start': (data: {
    roomId: string
    roundId: string
    timeLeft: number
    timeTotal: number
  }) => void
  'game:answering:end': (data: {
    roomId: string
    roundId: string
  }) => void
  'game:answer:submit': (data: { 
    roomId: string
    roundId: string
    userId: string
    answer: string 
  }) => void
  'game:answer:received': (data: {
    roundId: string
    message: string
  }) => void

  // Voting Phase
  'game:voting:start': (data: {
    roomId: string
    roundId: string
    answers: Array<{
      id: string
      content: string
    }>
    timeLeft: number
    timeTotal: number
  }) => void
  'game:voting:end': (data: {
    roomId: string
    roundId: string
    tallies: Array<{
      answerId: string
      voteCount: number
    }>
  }) => void
  'game:vote:submit': (data: { 
    roomId: string
    roundId: string
    userId: string
    votedForUserId: string 
  }) => void
  'game:vote:update': (data: {
    roomId: string
    roundId: string
    answerId: string
    voteCount: number
  }) => void

  // Score Updates
  'game:scores:update': (data: {
    roomId: string
    scores: Array<{
      userId: string
      points: number
      user?: { name?: string; email: string }
    }>
  }) => void

  'game:error': (data: { message: string }) => void

  // New Game Events for the updated flow
  'game:started': (data: { message: string; rounds: Array<{ id: string; question: string; roundNumber: number }> }) => void
  'game:state:update': (data: { status: string; currentRound: number; totalRounds: number }) => void
  'game:round:start': (data: { roundNumber: number; question: string; timeRemaining: number; phase: string }) => void
  'game:voting:start': (data: { roundNumber: number; timeRemaining: number; phase: string }) => void
  'game:answer:submitted': (data: { message: string }) => void
  'game:vote:submitted': (data: { message: string }) => void
  'game:answers:update': (data: { answers: Array<{ userId: string; answer: string }>; submittedCount: number }) => void
  'game:votes:update': (data: { votes: Array<{ userId: string; votedForUserId: string }>; votedCount: number }) => void
  'game:state:response': (data: { roomId: string; currentRound: number; totalRounds: number; status: string; currentQuestion?: string; timeRemaining: number; answers: Array<{ userId: string; answer: string }>; votes: Array<{ userId: string; votedForUserId: string }> }) => void
  'game:state:sync': (data: { roomId: string; currentRound: number; totalRounds: number; status: string; currentQuestion?: string; timeRemaining: number; answers: Array<{ userId: string; answer: string }>; votes: Array<{ userId: string; votedForUserId: string }> }) => void
  'game:ended': (data: { roomId: string; finalScores?: Array<{ userId: string; points: number }> }) => void
}

// Timer Events
export interface TimerEvents {
  'timer:tick': (data: {
    roomId: string
    roundId: string
    phase: GamePhase
    timeLeft: number
    serverTime: number
  }) => void
  'timer:end': (data: { 
    roomId: string
    roundId: string
    phase: GamePhase 
  }) => void
}

// Server to Client Events
export interface ServerToClientEvents extends RoomEvents, GameEvents, TimerEvents {
  // Basic Socket.IO events
  connect: () => void
  disconnect: (reason: string) => void
  error: (error: Error) => void
  connect_error: (error: Error) => void
}

// Client to Server Events
export interface ClientToServerEvents {
  // Room events
  'room:join': (data: { roomId: string }) => void
  'room:leave': (data: { roomId: string }) => void
  'room:sync': (data: { roomId: string }) => void

  // Game events
  'game:start': (data: { roomId: string; numRounds?: number }) => void
  'game:answer:submit': (data: { roomId: string; roundId: string; answer: string }) => void
  'game:vote:submit': (data: { roomId: string; roundId: string; votedForUserId: string }) => void
  'game:state:request': (data: { roomId: string }) => void
  'game:join': (data: { roomId: string }) => void
  'game:leave': (data: { roomId: string }) => void
}

// Inter-Server Events
export interface InterServerEvents {
  ping: () => void
}

// Socket Data
export interface SocketData {
  userId: string
  username: string
  roomId?: string
}

// Validation Interfaces
export interface RoomValidation {
  roomId: string
  userId: string
  isHost: boolean
  currentPhase: GamePhase
  isAnsweringPhase: boolean
  isVotingPhase: boolean
}

export interface AnswerValidation {
  hasAnswered: boolean
  isAnsweringPhase: boolean
  timeLeft: number
}

export interface VoteValidation {
  hasVoted: boolean
  isVotingPhase: boolean
  timeLeft: number
  isOwnAnswer: boolean
}