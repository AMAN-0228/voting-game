import { emitGamePhaseUpdate, emitRoundStart } from '@/handlers/socket/gameHandlers'
import { emitGameStarted } from '@/handlers/socket/gameHandlers'
import { emitVotingStart } from '@/handlers/socket/gameHandlers'
import { emitGameEvent } from '@/handlers/socket/gameHandlers'
import { prisma } from './prisma'
import { generateQuestions } from './question-service'
import { emitRoomStatusUpdate } from '@/handlers/socket/roomHandlers'
import { RoundStatus } from '@/types/socket-events'

export interface GameState {
  roomId: string
  sno: number
  currentRoundId: string
  totalRounds: number
  status: 'waiting' | 'answering' | 'voting' | 'finished'
  currentQuestion?: string
  timeRemaining: number
  answers: Map<string, string> // userId -> answer
  votes: Map<string, string> // userId -> votedAnswerId
  roundStartTime?: Date
  questionEndTime?: Date
  votingEndTime?: Date
  // rounds: Partial<RoundData>[]
}

export interface RoundData {
  id: string
  question: string
  sno: number
  roomId: string
  status: RoundStatus
  createdAt: string
  answers: Array<{ id: string; content: string; userId: string }>
  votes: Array<{ id: string; userId: string; answerId: string }>
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
      // console.log('__________ rounds __________', rounds);
      // Initialize game state
      const currentRound = rounds.find(r => r.sno === 1 )
      console.log('__________ currentRound __________', currentRound);
      const gameState: GameState = {
        roomId,
        currentRoundId: currentRound?.id || '',
        sno: 1,
        totalRounds: numRounds,
        status: 'waiting',
        timeRemaining: 0,
        answers: new Map(),
        votes: new Map(),
      }

      this.games.set(roomId, gameState)

      // Update room status
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'in_progress' }
      })
      emitRoomStatusUpdate(roomId, 'in_progress')
      // Start the first round
      const roundsData = rounds.map(r => ({ ...r, answers: [], votes: [] }))
      emitGameStarted(roomId, {
        message: 'Game started successfully',
        rounds: roundsData
      })
      await this.startRound(roomId)

      return { success: true, rounds: roundsData }
    } catch (error) {
      console.error('Failed to start game:', error)
      return { success: false, error: 'Failed to start game' }
    }
  }

  /**
   * Start a specific round
   */
  async startRound(roomId: string): Promise<void> {
    console.log('__________ startRound __________', roomId);
    const gameState = this.games.get(roomId)
    if (!gameState) return

    try {
      // Get current round data
      const round = await prisma.round.findFirst({
        where: { 
          roomId,
          sno: gameState.sno, 
        },
        include: {
          answers: true,
          votes: true,
        }
      })

      if (!round) {
        console.error('Round not found for room:', roomId, 'round:', gameState.currentRoundId)
        return
      }

      // Update round status
      await prisma.round.update({
        where: { id: round.id },
        data: { status: 'active' }
      })

      // Update game state
      gameState.currentRoundId = round.id
      gameState.status = 'answering'
      gameState.currentQuestion = round.question
      gameState.roundStartTime = new Date()
      gameState.questionEndTime = new Date(Date.now() + 30000) // 30 seconds
      gameState.timeRemaining = 30
      gameState.answers.clear()
      gameState.votes.clear()
      const emitResult = emitRoundStart(roomId,{
        roomId,
        roundId: round.id,
        roundNumber: gameState.sno,
        question: round.question,
        timeLeft: gameState.timeRemaining,
        timeTotal: 30,
        // answers: round.answers,
        // votes: round.votes,
      })
      
      if (emitResult.success) {
        console.log(`[GAME MANAGER] Round start event emitted successfully to room ${roomId}`)
        console.log(`[GAME MANAGER] Event sent to ${emitResult.clientCount} connected clients`)
      } else {
        console.warn(`[GAME MANAGER] Failed to emit round start event to room ${roomId}`)
        if (emitResult.clientCount === 0) {
          console.warn(`[GAME MANAGER] No clients are currently connected to room ${roomId}`)
        }
      }
      // Start question timer
      this.startQuestionTimer(roomId)

      console.log(`[GAME MANAGER] Started round ${gameState.sno} for room ${roomId}`)
    } catch (error) {
      console.error('Failed to start round:', error)
    }
  }

  /**
   * Start question timer (30 seconds)
   */
  private startQuestionTimer(roomId: string): void {
    console.log('__________ startQuestionTimer __________', roomId);
    const gameState = this.games.get(roomId)
    if (!gameState) return

    // Clear existing timer
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!)
    }

    const timer = setInterval(() => {
      if (!gameState.timeRemaining || gameState.timeRemaining <= 0) {
        this.endAnsweringPhase(roomId)
        return
      }

      gameState.timeRemaining--
    }, 1000)

    this.timers.set(roomId, timer)
  }

  /**
   * End answering phase and start voting
   */
  private async endAnsweringPhase(roomId: string): Promise<void> {
    console.log('__________ endAnsweringPhase __________', roomId);
    const gameState = this.games.get(roomId)
    if (!gameState) return

    // Clear question timer
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!)
    }

    // Save answers to database
    // await this.saveAnswers(roomId)

    // Start voting phase
    gameState.status = 'voting'
    gameState.timeRemaining = 30
    gameState.votingEndTime = new Date(Date.now() + 30000)

    // Emit voting start event
    emitGamePhaseUpdate(roomId, {
      type: 'voting',
      timeLeft: gameState.timeRemaining,
      timeTotal: 30,
      totalRounds: gameState.totalRounds,
      roundSno: gameState.sno
    })

    // Start voting timer after delay of 5s
    setTimeout(()=> {
      this.startVotingTimer(roomId)
      
    },3000)
    
    console.log(`[GAME MANAGER] Answering phase ended, voting started for room ${roomId}`)
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

    // Emit round end event
    emitGameEvent(roomId, 'GAME_ROUND_END', {
      scores: {} // Will be populated with actual scores
    })

    // Check if game is finished
    if (gameState.sno >= gameState.totalRounds) {
      await this.endGame(roomId)
    } else {
      // Start next round
      gameState.sno++
      await this.startRound(roomId)
    }

    console.log(`[GAME MANAGER] Voting phase ended for room ${roomId}`)
  }

  /**
   * Save answers to database
   */
  private async saveAnswers(roomId: string): Promise<void> {
    console.log('__________ saveAnswers __________', roomId);
    const gameState = this.games.get(roomId)
    if (!gameState) return

    try {
      const round = await prisma.round.findFirst({
        where: { 
          id: gameState.currentRoundId,
        }
      })

      if (!round) return


      console.log(`[GAME MANAGER] Saved ${answersToSave.length} answers for room ${roomId}`)
    } catch (error) {
      console.error('Failed to save answers:', error)
    }
  }

  /**
   * Save votes to database
   */
  private async saveVotes(roomId: string): Promise<void> {
    console.log('__________ saveVotes __________', roomId);
    const gameState = this.games.get(roomId)
    if (!gameState) return

    try {
      const round = await prisma.round.findFirst({
        where: { 
          id: gameState.currentRoundId,
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
        .filter(([userId, votedAnswerId]) => userIdToAnswerId.has(votedAnswerId))
        .map(([userId, votedAnswerId]) => ({
          roundId: round.id,
          voterId: userId,
          answerId: userIdToAnswerId.get(votedAnswerId)!,
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
    try {
      const gameState = this.games.get(roomId)
      if (!gameState) {
        return { success: false, error: 'Game not found' }
      }

      if (gameState.status !== 'answering') {
        return { success: false, error: 'Not in answering phase' }
      }

      // Get the current round for this room
      const currentRound = await prisma.round.findFirst({
        where: { 
          id: gameState.currentRoundId,
        },
        include: {
          answers: true,
          votes: true,
        }
      })

      if (!currentRound) {
        return { success: false, error: 'Current round not found' }
      }

      // Check if user has already answered for this round
      const existingAnswer = await prisma.answer.findFirst({
        where: {
          roundId: currentRound.id,
          userId
        }
      })

      if (existingAnswer) {
        return { success: false, error: 'User has already answered for this round' }
      }

      // Save answer to database
      const savedAnswer = await prisma.answer.create({
        data: {
          content: answer,
          roundId: currentRound.id,
          userId
        }
      })

      // Also save in memory for real-time updates
      gameState.answers.set(userId, answer)

      console.log(`[GAME MANAGER] Answer saved to database for user ${userId} in room ${roomId}, round ${gameState.sno}`)
      return { success: true }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      return { success: false, error: 'Failed to save answer to database' }
    }
  }

  /**
   * Submit a vote for a user
   */
  async submitVote(roomId: string, userId: string, answerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('__________ submitVote __________', roomId, userId, answerId);
      const gameState = this.games.get(roomId)
      if (!gameState) {
        return { success: false, error: 'Game not found' }
      }

      if (gameState.status !== 'voting') {
        return { success: false, error: 'Not in voting phase' }
      }

      // Get the current round for this room
      const currentRound = await prisma.round.findFirst({
        where: { 
          id: gameState.currentRoundId,
        }
      })

      if (!currentRound) {
        return { success: false, error: 'Current round not found' }
      }

      // Check if user has already voted for this round
      // const existingVote = await prisma.vote.findFirst({
      //   where: {
      //     roundId: currentRound.id,
      //     voterId: userId
      //   }
      // })
      const existingVote = gameState.votes.get(userId)
      console.log('__________ existingVote __________', existingVote);

      if (existingVote) {
        return { success: false, error: 'User has already voted for this round' }
      }

      // Get the answer that the user is voting for
      const targetAnswer = await prisma.answer.findFirst({
        where: {
          roundId: currentRound.id,
          id: answerId,
        }
      })

      if (!targetAnswer) {
        return { success: false, error: 'Target answer not found' }
      }
      // Save vote to database
      // const savedVote = await prisma.vote.create({
      //   data: {
      //     roundId: currentRound.id,
      //     voterId: userId,
      //     answerId: targetAnswer.id
      //   }
      // })

      // Also save in memory for real-time updates
      gameState.votes.set(userId, answerId)
      console.log('__________ gameState.votes __________', gameState.votes);

      console.log(`[GAME MANAGER] Vote saved to database for user ${userId} voting for ${answerId} in room ${roomId}, round ${gameState.currentRound}`)
      return { success: true }
    } catch (error) {
      console.error('Failed to submit vote:', error)
      return { success: false, error: 'Failed to save vote to database' }
    }
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
  async getCurrentAnswers(roomId: string): Promise<Map<string, string>> {
    try {
      const gameState = this.games.get(roomId)
      if (!gameState) {
        return new Map()
      }

      // Get current round
      const currentRound = await prisma.round.findFirst({
        where: { 
          id: gameState.currentRoundId,
        }
      })

      if (!currentRound) {
        return new Map()
      }

      // Fetch answers from database
      const answers = await prisma.answer.findMany({
        where: { roundId: currentRound.id },
        include: { user: true }
      })

      // Convert to Map for consistency
      const answersMap = new Map<string, string>()
      answers.forEach(answer => {
        answersMap.set(answer.userId, answer.content)
      })

      return answersMap
    } catch (error) {
      console.error('Failed to get current answers:', error)
      // Fallback to memory state
      const gameState = this.games.get(roomId)
      return gameState?.answers || new Map()
    }
  }

  /**
   * Get current votes for live display
   */
  async getCurrentVotes(roomId: string): Promise<Map<string, string>> {
    try {
      const gameState = this.games.get(roomId)
      if (!gameState) {
        return new Map()
      }

      // Get current round
      const currentRound = await prisma.round.findFirst({
        where: { 
          roomId,
          sno: gameState.sno
        }
      })

      if (!currentRound) {
        return new Map()
      }

      // // Fetch votes from database
      // const votes = await prisma.vote.findMany({
      //   where: { roundId: currentRound.id },
      //   include: { 
      //     voter: true,
      //     answer: { include: { user: true } }
      //   }
      // })

      // // Convert to Map for consistency (voterId -> answerUserId)
      // const votesMap = new Map<string, string>()
      // votes.forEach(vote => {
      //   votesMap.set(vote.voterId, vote.answer.userId)
      // })

      const votesMap = gameState.votes
      console.log('_____________ votes', {votesMap});
      

      return votesMap
    } catch (error) {
      console.error('Failed to get current votes:', error)
      // Fallback to memory state
      const gameState = this.games.get(roomId)
      return gameState?.votes || new Map()
    }
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
