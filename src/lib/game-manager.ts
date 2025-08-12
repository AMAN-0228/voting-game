import { prisma } from './prisma'
import { generateQuestions } from './question-service'

export interface GameState {
  roomId: string
  currentRound: number
  totalRounds: number
  status: 'waiting' | 'question' | 'voting' | 'finished'
  currentQuestion?: string
  timeRemaining: number
  answers: Map<string, string> // userId -> answer
  votes: Map<string, string> // userId -> votedForUserId
  roundStartTime?: Date
  questionEndTime?: Date
  votingEndTime?: Date
}

export interface RoundData {
  id: string
  question: string
  sno: number
  answers: Array<{ id: string; content: string; userId: string }>
  votes: Array<{ id: string; userId: string; votedForUserId: string }>
}

class GameManager {
  private games = new Map<string, GameState>()
  private timers = new Map<string, NodeJS.Timeout>()

  /**
   * Start a new game for a room
   */
  async startGame(roomId: string, numRounds: number = 3): Promise<{ success: boolean; error?: string; rounds?: RoundData[] }> {
    try {
      // Check if room exists and user is host
      const room = await prisma.room.findUnique({
        where: { id: roomId }
      })

      if (!room) {
        return { success: false, error: 'Room not found' }
      }

      if (room.status !== 'starting') {
        return { success: false, error: 'Room is not in starting state' }
      }

      // Generate questions using Gemini
      const questions = await generateQuestions(numRounds)
      if (!questions || questions.length === 0) {
        return { success: false, error: 'Failed to generate questions' }
      }

      // Create rounds in database
      const rounds = await Promise.all(
        questions.map(async (question, index) => {
          return await prisma.round.create({
            data: {
              roomId,
              question,
              sno: index + 1,
              status: 'pending'
            }
          })
        })
      )

      // Initialize game state
      const gameState: GameState = {
        roomId,
        currentRound: 1,
        totalRounds: numRounds,
        status: 'waiting',
        timeRemaining: 0,
        answers: new Map(),
        votes: new Map()
      }

      this.games.set(roomId, gameState)

      // Update room status
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'in_progress' }
      })

      // Start the first round
      await this.startRound(roomId)

      return { success: true, rounds: rounds.map(r => ({ ...r, answers: [], votes: [] })) }
    } catch (error) {
      console.error('Failed to start game:', error)
      return { success: false, error: 'Failed to start game' }
    }
  }

  /**
   * Start a specific round
   */
  async startRound(roomId: string): Promise<void> {
    const gameState = this.games.get(roomId)
    if (!gameState) return

    try {
      // Get current round data
      const round = await prisma.round.findFirst({
        where: { 
          roomId, 
          sno: gameState.currentRound 
        }
      })

      if (!round) {
        console.error('Round not found for room:', roomId, 'round:', gameState.currentRound)
        return
      }

      // Update round status
      await prisma.round.update({
        where: { id: round.id },
        data: { status: 'active' }
      })

      // Update game state
      gameState.status = 'question'
      gameState.currentQuestion = round.question
      gameState.roundStartTime = new Date()
      gameState.questionEndTime = new Date(Date.now() + 30000) // 30 seconds
      gameState.timeRemaining = 30
      gameState.answers.clear()
      gameState.votes.clear()

      // Start question timer
      this.startQuestionTimer(roomId)

      console.log(`[GAME MANAGER] Started round ${gameState.currentRound} for room ${roomId}`)
    } catch (error) {
      console.error('Failed to start round:', error)
    }
  }

  /**
   * Start question timer (30 seconds)
   */
  private startQuestionTimer(roomId: string): void {
    const gameState = this.games.get(roomId)
    if (!gameState) return

    // Clear existing timer
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!)
    }

    const timer = setInterval(() => {
      if (!gameState.timeRemaining || gameState.timeRemaining <= 0) {
        this.endQuestionPhase(roomId)
        return
      }

      gameState.timeRemaining--
    }, 1000)

    this.timers.set(roomId, timer)
  }

  /**
   * End question phase and start voting
   */
  private async endQuestionPhase(roomId: string): Promise<void> {
    const gameState = this.games.get(roomId)
    if (!gameState) return

    // Clear question timer
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!)
    }

    // Save answers to database
    await this.saveAnswers(roomId)

    // Start voting phase
    gameState.status = 'voting'
    gameState.timeRemaining = 30
    gameState.votingEndTime = new Date(Date.now() + 30000)

    // Start voting timer
    this.startVotingTimer(roomId)

    console.log(`[GAME MANAGER] Question phase ended, voting started for room ${roomId}`)
  }

  /**
   * Start voting timer (30 seconds)
   */
  private startVotingTimer(roomId: string): void {
    const gameState = this.games.get(roomId)
    if (!gameState) return

    const timer = setInterval(() => {
      if (!gameState.timeRemaining || gameState.timeRemaining <= 0) {
        this.endVotingPhase(roomId)
        return
      }

      gameState.timeRemaining--
    }, 1000)

    this.timers.set(roomId, timer)
  }

  /**
   * End voting phase and process results
   */
  private async endVotingPhase(roomId: string): Promise<void> {
    const gameState = this.games.get(roomId)
    if (!gameState) return

    // Clear voting timer
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!)
    }

    // Save votes to database
    await this.saveVotes(roomId)

    // Check if game is finished
    if (gameState.currentRound >= gameState.totalRounds) {
      await this.endGame(roomId)
    } else {
      // Start next round
      gameState.currentRound++
      await this.startRound(roomId)
    }

    console.log(`[GAME MANAGER] Voting phase ended for room ${roomId}`)
  }

  /**
   * Save answers to database
   */
  private async saveAnswers(roomId: string): Promise<void> {
    const gameState = this.games.get(roomId)
    if (!gameState) return

    try {
      const round = await prisma.round.findFirst({
        where: { 
          roomId, 
          sno: gameState.currentRound 
        }
      })

      if (!round) return

      // Save all answers
      const answersToSave = Array.from(gameState.answers.entries()).map(([userId, answer]) => ({
        roundId: round.id,
        userId,
        content: answer,
        createdAt: new Date()
      }))

      if (answersToSave.length > 0) {
        await prisma.answer.createMany({
          data: answersToSave
        })
      }

      console.log(`[GAME MANAGER] Saved ${answersToSave.length} answers for room ${roomId}`)
    } catch (error) {
      console.error('Failed to save answers:', error)
    }
  }

  /**
   * Save votes to database
   */
  private async saveVotes(roomId: string): Promise<void> {
    const gameState = this.games.get(roomId)
    if (!gameState) return

    try {
      const round = await prisma.round.findFirst({
        where: { 
          roomId, 
          sno: gameState.currentRound 
        }
      })

      if (!round) return

      // Get answers for this round to map userId to answerId
      const answers = await prisma.answer.findMany({
        where: { roundId: round.id }
      })

      // Create a map of userId to answerId
      const userIdToAnswerId = new Map<string, string>()
      answers.forEach(answer => {
        userIdToAnswerId.set(answer.userId, answer.id)
      })

      // Save all votes
      const votesToSave = Array.from(gameState.votes.entries())
        .filter(([userId, votedForUserId]) => userIdToAnswerId.has(votedForUserId))
        .map(([userId, votedForUserId]) => ({
          roundId: round.id,
          voterId: userId,
          answerId: userIdToAnswerId.get(votedForUserId)!,
          createdAt: new Date()
        }))

      if (votesToSave.length > 0) {
        await prisma.vote.createMany({
          data: votesToSave
        })
      }

      console.log(`[GAME MANAGER] Saved ${votesToSave.length} votes for room ${roomId}`)
    } catch (error) {
      console.error('Failed to save votes:', error)
    }
  }

  /**
   * End the game
   */
  private async endGame(roomId: string): Promise<void> {
    try {
      // Update room status
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'done' }
      })

      // Clean up game state
      this.games.delete(roomId)
      if (this.timers.has(roomId)) {
        clearInterval(this.timers.get(roomId)!)
        this.timers.delete(roomId)
      }

      console.log(`[GAME MANAGER] Game ended for room ${roomId}`)
    } catch (error) {
      console.error('Failed to end game:', error)
    }
  }

  /**
   * Submit an answer for a user
   */
  async submitAnswer(roomId: string, userId: string, answer: string): Promise<{ success: boolean; error?: string }> {
    const gameState = this.games.get(roomId)
    if (!gameState) {
      return { success: false, error: 'Game not found' }
    }

    if (gameState.status !== 'question') {
      return { success: false, error: 'Not in question phase' }
    }

    // Save answer in memory
    gameState.answers.set(userId, answer)

    console.log(`[GAME MANAGER] Answer submitted for user ${userId} in room ${roomId}`)
    return { success: true }
  }

  /**
   * Submit a vote for a user
   */
  async submitVote(roomId: string, userId: string, votedForUserId: string): Promise<{ success: boolean; error?: string }> {
    const gameState = this.games.get(roomId)
    if (!gameState) {
      return { success: false, error: 'Game not found' }
    }

    if (gameState.status !== 'voting') {
      return { success: false, error: 'Not in voting phase' }
    }

    // Save vote in memory
    gameState.votes.set(userId, votedForUserId)

    console.log(`[GAME MANAGER] Vote submitted for user ${userId} voting for ${votedForUserId} in room ${roomId}`)
    return { success: true }
  }

  /**
   * Get current game state
   */
  getGameState(roomId: string): GameState | null {
    return this.games.get(roomId) || null
  }

  /**
   * Get current answers for live display
   */
  getCurrentAnswers(roomId: string): Map<string, string> {
    const gameState = this.games.get(roomId)
    return gameState?.answers || new Map()
  }

  /**
   * Get current votes for live display
   */
  getCurrentVotes(roomId: string): Map<string, string> {
    const gameState = this.games.get(roomId)
    return gameState?.votes || new Map()
  }

  /**
   * Clean up game when room is closed
   */
  cleanupGame(roomId: string): void {
    this.games.delete(roomId)
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!)
      this.timers.delete(roomId)
    }
    console.log(`[GAME MANAGER] Game cleaned up for room ${roomId}`)
  }
}

// Export singleton instance
export const gameManager = new GameManager()
