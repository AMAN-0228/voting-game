import { RoundStatus } from '@/types/socket-events'
import { create } from 'zustand'
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware'

// Types for game state
export interface Round {
  id: string
  question: string
  status: RoundStatus
  sno: number
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
  totalRounds?: number
  roundSno?: number
}

export interface GameState {
  // Current game data
  currentRound: Round | null
  roundId: string
  rounds: Round[]
  scores: Score[]
  gamePhase: GamePhase
  totalRounds: number
  // User's current state
  userAnswer: string
  hasSubmittedAnswer: boolean
  hasVoted: boolean
  votedAnswerId: string | null
  
  // Real-time state
  isConnected: boolean
  playersOnline: string[]
  // Round data
  answers: Answer[]
  votes: Map<string, string[]>
  
  // Actions
  setCurrentRound: (round: Round | null) => void
  setRoundId: (roundId: string) => void
  addRound: (round: Round) => void
  updateRounds: (rounds: Round[]) => void
  
  setScores: (scores: Score[]) => void
  updateScore: (userId: string, points: number) => void
  
  setGamePhase: (phase: GamePhase) => void
  setTotalRounds: (totalRounds: number) => void

  setUserAnswer: (answer: string) => void
  setHasSubmittedAnswer: (submitted: boolean) => void
  setHasVoted: (voted: boolean) => void
  setVotedAnswerId: (answerId: string | null) => void
  
  addAnswer: (answer: Answer) => void
  addVote: (vote: Vote) => void
  
  setIsConnected: (connected: boolean) => void
  setPlayersOnline: (players: string[]) => void
  setAnswers: (answers: Answer[]) => void
  setVotes: (votes: Map<string, string[]>) => void
  // Reset functions
  resetUserState: () => void
  resetGameState: () => void
}



export const useGameStore = create<GameState>()(
  devtools(
      subscribeWithSelector((set) => ({
        // Use the initial state object
        currentRound: null,
        roundId: '',
        rounds: [],
        scores: [],
        gamePhase: { type: 'waiting' },
        totalRounds: 0,
        userAnswer: '',
        hasSubmittedAnswer: false,
        hasVoted: false,
        votedAnswerId: null,
        isConnected: false,
        playersOnline: [],
        answers: [],
        votes: new Map<string, string[]>(),
        // Actions
        setCurrentRound: (round) => set({ currentRound: round }),
        setRoundId: (roundId) => set({ roundId }),
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
        setTotalRounds: (totalRounds) => set({ totalRounds }),
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
        setAnswers: (answers) => set({ answers }),
        setVotes: (votes) => set({ votes }),
        resetUserState: () => set({
          userAnswer: '',
          hasSubmittedAnswer: false,
          hasVoted: false,
          votedAnswerId: null,
        }),
        
        resetGameState: () => set({
          currentRound: null,
          rounds: [],
          roundId: '',
          scores: [],
          gamePhase: { type: 'waiting' },
          userAnswer: '',
          hasSubmittedAnswer: false,
          hasVoted: false,
          votedAnswerId: null,
          isConnected: false,
          playersOnline: [],
          answers: []
        }),
      })),
      {
        name: 'game-store',
        // Only persist game state data
        partialize: (state) => ({
          currentRound: state.currentRound,
          rounds: state.rounds,
          roundId: state.roundId,
          scores: state.scores,
          gamePhase: state.gamePhase,
          userAnswer: state.userAnswer,
          hasSubmittedAnswer: state.hasSubmittedAnswer,
          hasVoted: state.hasVoted,
          votedAnswerId: state.votedAnswerId,
          answers: state.answers,
        }),
      }
    )
)
