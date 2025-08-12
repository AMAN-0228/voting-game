import { Server, Socket } from 'socket.io'
import { gameManager } from '@/lib/game-manager'
import { getIO } from '@/lib/socket-server'
import { prisma } from '@/lib/prisma'

export function registerGameHandlers(io: Server, socket: Socket) {
  console.log('[GAME HANDLERS] Registering game handlers for socket:', socket.id)

  // Start Game
  socket.on('game:start', async ({ roomId, numRounds = 3 }) => {
    try {
      console.log('[GAME HANDLERS] game:start event received for roomId:', roomId, 'numRounds:', numRounds)
      
      // Check if user is host
      const room = await prisma.room.findUnique({
        where: { id: roomId }
      })

      if (!room) {
        socket.emit('game:error', { message: 'Room not found' })
        return
      }

      if (room.hostId !== socket.data.userId) {
        socket.emit('game:error', { message: 'Only host can start the game' })
        return
      }

      // Start the game using game manager
      const result = await gameManager.startGame(roomId, numRounds)
      
      if (!result.success) {
        socket.emit('game:error', { message: result.error || 'Failed to start game' })
        return
      }

      // Emit success to host
      socket.emit('game:started', { 
        message: 'Game started successfully',
        rounds: result.rounds
      })

      // Notify all players in room
      io.to(roomId).emit('game:state:update', {
        status: 'in_progress',
        currentRound: 1,
        totalRounds: numRounds
      })

      // Start first round and emit question
      const gameState = gameManager.getGameState(roomId)
      if (gameState) {
        io.to(roomId).emit('game:round:start', {
          roundNumber: gameState.currentRound,
          question: gameState.currentQuestion,
          timeRemaining: gameState.timeRemaining,
          phase: 'question'
        })
      }

      console.log('[GAME HANDLERS] Game started successfully for room:', roomId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error starting game:', error)
      socket.emit('game:error', { message: 'Failed to start game' })
    }
  })

  // Submit Answer
  socket.on('game:answer:submit', async ({ roomId, roundId, answer }) => {
    try {
      console.log('[GAME HANDLERS] game:answer:submit event received:', { roomId, roundId, answer })
      
      const result = await gameManager.submitAnswer(roomId, socket.data.userId, answer)
      
      if (!result.success) {
        socket.emit('game:error', { message: result.error || 'Failed to submit answer' })
        return
      }

      // Emit success to user
      socket.emit('game:answer:submitted', { message: 'Answer submitted successfully' })

      // Get current answers and emit to all players for live display
      const currentAnswers = gameManager.getCurrentAnswers(roomId)
      const answersArray = Array.from(currentAnswers.entries()).map(([userId, answer]) => ({
        userId,
        answer
      }))

      io.to(roomId).emit('game:answers:update', {
        answers: answersArray,
        submittedCount: answersArray.length
      })

      console.log('[GAME HANDLERS] Answer submitted successfully for user:', socket.data.userId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error submitting answer:', error)
      socket.emit('game:error', { message: 'Failed to submit answer' })
    }
  })

  // Submit Vote
  socket.on('game:vote:submit', async ({ roomId, roundId, votedForUserId }) => {
    try {
      console.log('[GAME HANDLERS] game:vote:submit event received:', { roomId, roundId, votedForUserId })
      
      const result = await gameManager.submitVote(roomId, socket.data.userId, votedForUserId)
      
      if (!result.success) {
        socket.emit('game:error', { message: result.error || 'Failed to submit vote' })
        return
      }

      // Emit success to user
      socket.emit('game:vote:submitted', { message: 'Vote submitted successfully' })

      // Get current votes and emit to all players for live display
      const currentVotes = gameManager.getCurrentVotes(roomId)
      const votesArray = Array.from(currentVotes.entries()).map(([userId, votedForUserId]) => ({
        userId,
        votedForUserId
      }))

      io.to(roomId).emit('game:votes:update', {
        votes: votesArray,
        votedCount: votesArray.length
      })

      console.log('[GAME HANDLERS] Vote submitted successfully for user:', socket.data.userId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error submitting vote:', error)
      socket.emit('game:error', { message: 'Failed to submit vote' })
    }
  })

  // Get Game State
  socket.on('game:state:request', async ({ roomId }) => {
    try {
      console.log('[GAME HANDLERS] game:state:request event received for roomId:', roomId)
      
      const gameState = gameManager.getGameState(roomId)
      
      if (!gameState) {
        socket.emit('game:error', { message: 'No active game found' })
        return
      }

      // Get current answers and votes for live display
      const currentAnswers = gameManager.getCurrentAnswers(roomId)
      const currentVotes = gameManager.getCurrentVotes(roomId)

      socket.emit('game:state:response', {
        ...gameState,
        answers: Array.from(currentAnswers.entries()).map(([userId, answer]) => ({ userId, answer })),
        votes: Array.from(currentVotes.entries()).map(([userId, votedForUserId]) => ({ userId, votedForUserId }))
      })

      console.log('[GAME HANDLERS] Game state sent to user:', socket.data.userId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error getting game state:', error)
      socket.emit('game:error', { message: 'Failed to get game state' })
    }
  })

  // Join Game Room
  socket.on('game:join', async ({ roomId }) => {
    try {
      console.log('[GAME HANDLERS] game:join event received for roomId:', roomId)
      
      // Join the socket room
      await socket.join(roomId)
      
      // Get current game state if game is active
      const gameState = gameManager.getGameState(roomId)
      if (gameState) {
        // Send current game state to the joining player
        const currentAnswers = gameManager.getCurrentAnswers(roomId)
        const currentVotes = gameManager.getCurrentVotes(roomId)

        socket.emit('game:state:sync', {
          ...gameState,
          answers: Array.from(currentAnswers.entries()).map(([userId, answer]) => ({ userId, answer })),
          votes: Array.from(currentVotes.entries()).map(([userId, votedForUserId]) => ({ userId, votedForUserId }))
        })

        // If in question phase, send current question
        if (gameState.status === 'question') {
          socket.emit('game:round:start', {
            roundNumber: gameState.currentRound,
            question: gameState.currentQuestion || '',
            timeRemaining: gameState.timeRemaining,
            phase: 'question'
          })
        }

        // If in voting phase, send current voting state
        if (gameState.status === 'voting') {
          socket.emit('game:voting:start', {
            roundNumber: gameState.currentRound,
            timeRemaining: gameState.timeRemaining,
            phase: 'voting'
          })
        }
      }

      console.log('[GAME HANDLERS] User joined game room:', socket.data.userId, 'room:', roomId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error joining game room:', error)
      socket.emit('game:error', { message: 'Failed to join game room' })
    }
  })

  // Leave Game Room
  socket.on('game:leave', async ({ roomId }) => {
    try {
      console.log('[GAME HANDLERS] game:leave event received for roomId:', roomId)
      
      // Leave the socket room
      await socket.leave(roomId)
      
      console.log('[GAME HANDLERS] User left game room:', socket.data.userId, 'room:', roomId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error leaving game room:', error)
      socket.emit('game:error', { message: 'Failed to leave game room' })
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('[GAME HANDLERS] User disconnected from game:', socket.data.userId)
    // Clean up any game-related data if needed
  })
}

// Export function to emit game events from other parts of the system
export function emitGameEvent(roomId: string, event: string, data: unknown) {
  const io = getIO()
  if (io) {
    // Use proper typing for dynamic events
    const room = io.to(roomId)
    if (room && typeof room.emit === 'function') {
      room.emit(event, data)
    }
  }
}

export function emitGameStarted(roomId: string, data: { message: string; rounds: Array<{ id: string; question: string; roundNumber: number }> }) {
  const io = getIO()
  if (io) {
    io.to(roomId).emit('game:started', data)
  }
}

export function emitGameStateUpdate(roomId: string, data: { status: string; currentRound: number; totalRounds: number }) {
  const io = getIO()
  if (io) {
    io.to(roomId).emit('game:state:update', data)
  }
}

export function emitRoundStart(roomId: string, data: { roundNumber: number; question: string; timeRemaining: number; phase: string }) {
  const io = getIO()
  if (io) {
    io.to(roomId).emit('game:round:start', data)
  }
}

export function emitVotingStart(roomId: string, data: { roundNumber: number; timeRemaining: number; phase: string }) {
  const io = getIO()
  if (io) {
    io.to(roomId).emit('game:voting:start', data)
  }
}

// Export function to emit game end
export function emitGameEnd(roomId: string, gameResults: { roomId: string; finalScores?: Array<{ userId: string; points: number }> }) {
  emitGameEvent(roomId, 'game:ended', gameResults)
}