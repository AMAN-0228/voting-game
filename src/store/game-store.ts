import { create } from 'zustand'
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware'

// Types for game state
export interface Round {
  id: string
  question: string
  createdAt: string
  roomId: string
  answers: Answer[]
  votes: Vote[]
}

export interface Answer {
  id: string
  content: string
  userId: string
  roundId: string
  createdAt: string
  votes: Vote[]
}

export interface Vote {
  id: string
  voterId: string
  answerId: string
  roundId: string
  createdAt: string
}

export interface Score {
  id: string
  userId: string
  roomId: string
  points: number
  user?: {
    id: string
    name?: string
    email: string
  }
}

export interface GamePhase {
  type: 'waiting' | 'answering' | 'voting' | 'results' | 'finished'
  timeLeft?: number
  totalTime?: number
}

export interface GameState {
  // Current game data
  currentRound: Round | null
  rounds: Round[]
  scores: Score[]
  gamePhase: GamePhase
  
  // User's current state
  userAnswer: string
  hasSubmittedAnswer: boolean
  hasVoted: boolean
  votedAnswerId: string | null
  
  // Real-time state
  isConnected: boolean
  playersOnline: string[]
  
  // Actions
  setCurrentRound: (round: Round | null) => void
  addRound: (round: Round) => void
  updateRounds: (rounds: Round[]) => void
  
  setScores: (scores: Score[]) => void
  updateScore: (userId: string, points: number) => void
  
  setGamePhase: (phase: GamePhase) => void
  
  setUserAnswer: (answer: string) => void
  setHasSubmittedAnswer: (submitted: boolean) => void
  setHasVoted: (voted: boolean) => void
  setVotedAnswerId: (answerId: string | null) => void
  
  addAnswer: (answer: Answer) => void
  addVote: (vote: Vote) => void
  
  setIsConnected: (connected: boolean) => void
  setPlayersOnline: (players: string[]) => void
  
  // Reset functions
  resetUserState: () => void
  resetGameState: () => void
}

// Initial state that's safe for SSR
const initialState = {
  currentRound: null,
  rounds: [],
  scores: [],
  gamePhase: { type: 'waiting' },
  userAnswer: '',
  hasSubmittedAnswer: false,
  hasVoted: false,
  votedAnswerId: null,
  isConnected: false,
  playersOnline: [],
} as const

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // Use the initial state object
        ...initialState,
        
        // Actions
        setCurrentRound: (round) => set({ currentRound: round }),
        
        addRound: (round) => set((state) => ({
          rounds: [...state.rounds, round]
        })),
        
        updateRounds: (rounds) => set({ rounds }),
        
        setScores: (scores) => set({ scores }),
        
        updateScore: (userId, points) => set((state) => ({
          scores: state.scores.map(score =>
            score.userId === userId
              ? { ...score, points }
              : score
          )
        })),
        
        setGamePhase: (phase) => set({ gamePhase: phase }),
        
        setUserAnswer: (answer) => set({ userAnswer: answer }),
        setHasSubmittedAnswer: (submitted) => set({ hasSubmittedAnswer: submitted }),
        setHasVoted: (voted) => set({ hasVoted: voted }),
        setVotedAnswerId: (answerId) => set({ votedAnswerId: answerId }),
        
        addAnswer: (answer) => set((state) => {
          if (!state.currentRound) return state
          
          const updatedRound = {
            ...state.currentRound,
            answers: [...state.currentRound.answers, answer]
          }
          
          return {
            currentRound: updatedRound,
            rounds: state.rounds.map(round =>
              round.id === updatedRound.id ? updatedRound : round
            )
          }
        }),
        
        addVote: (vote) => set((state) => {
          if (!state.currentRound) return state
          
          const updatedAnswers = state.currentRound.answers.map(answer =>
            answer.id === vote.answerId
              ? { ...answer, votes: [...answer.votes, vote] }
              : answer
          )
          
          const updatedRound = {
            ...state.currentRound,
            answers: updatedAnswers,
            votes: [...state.currentRound.votes, vote]
          }
          
          return {
            currentRound: updatedRound,
            rounds: state.rounds.map(round =>
              round.id === updatedRound.id ? updatedRound : round
            )
          }
        }),
        
        setIsConnected: (connected) => set({ isConnected: connected }),
        setPlayersOnline: (players) => set({ playersOnline: players }),
        
        resetUserState: () => set({
          userAnswer: '',
          hasSubmittedAnswer: false,
          hasVoted: false,
          votedAnswerId: null,
        }),
        
        resetGameState: () => set(initialState),
      }),
      {
        name: 'game-store',
      }
    )
  )
)
