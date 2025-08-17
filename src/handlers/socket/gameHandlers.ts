import { Server, Socket } from 'socket.io'
import { gameManager } from '@/lib/game-manager'
import { getIO } from '@/lib/socket-server'
import { prisma } from '@/lib/prisma'
import { SOCKET_EVENTS } from '@/constants/api-routes'
import { Round } from '@/store'

export function registerGameHandlers(io: Server, socket: Socket) {
  console.log('[GAME HANDLERS] Registering game handlers for socket:', socket.id)

  // Start Game
  socket.on(SOCKET_EVENTS.GAME_START, async ({ roomId, numRounds = 3 }) => {
    try {
      console.log('[GAME HANDLERS] game:start event received for roomId:', roomId, 'numRounds:', numRounds)
      
      // Check if user is host
      const room = await prisma.room.findUnique({
        where: { id: roomId }
      })

      if (!room) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Room not found' })
        return
      }

      if (room.hostId !== socket.data.userId) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Only host can start the game' })
        return
      }

      // Start the game using game manager
      const result = await gameManager.startGame(roomId, numRounds)
      
      if (!result.success) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: result.error || 'Failed to start game' })
        return
      }

      // Start first round and emit question
      // Wait a bit for the round to be fully initialized
      // setTimeout(() => {
      //   const gameState = gameManager.getGameState(roomId)
      //   console.log('__________ gameState after delay __________', gameState);
      //   if (gameState && gameState.currentQuestion) {
      //     console.log(`[GAME HANDLERS] Emitting GAME_ROUND_START to room ${roomId}`)
      //     io.to(roomId).emit(SOCKET_EVENTS.GAME_ROUND_START, {
      //       roomId,
      //       roundId: gameState.currentRoundId,
      //       roundNumber: gameState.sno,
      //       // question: gameState.currentQuestion,
      //       timeLeft: gameState.timeRemaining,
      //       phase: 'answering'
      //     })
      //   }
      // }, 100) // Small delay to ensure round is initialized

      console.log('[GAME HANDLERS] Game started successfully for room:', roomId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error starting game:', error)
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Failed to start game' })
    }
  })

  // Submit Answer
  socket.on(SOCKET_EVENTS.GAME_ANSWER_SUBMIT, async ({ roomId, roundId, answer }) => {
    try {
      console.log('[GAME HANDLERS] game:answer:submit event received:', { roomId, roundId, answer })
      console.log('__________ socket  __________', { roomId, roundId, answer});
      const result = await gameManager.submitAnswer(roomId, socket.data.userId, answer)
      
      if (!result.success) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: result.error || 'Failed to submit answer' })
        return
      }

      // Emit success to user
      // socket.emit('game:answer:submitted', { message: 'Answer submitted successfully' })

      // Get current answers and emit to all players for live display
      // const currentAnswers = await gameManager.getCurrentAnswers(roomId)
      // const answersArray = Array.from(currentAnswers.entries()).map(([userId, answer]) => ({
      //   userId,
      //   answer
      // }))

      // io.to(roomId).emit('game:answers:update', {
      //   answers: answersArray,
      //   submittedCount: answersArray.length
      // })
      socket.emit(SOCKET_EVENTS.GAME_ANSWER_SUBMITTED, { message: 'Answer submitted successfully', answer: answer })


      console.log('[GAME HANDLERS] Answer submitted successfully for user:', socket.data.userId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error submitting answer:', error)
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Failed to submit answer' })
    }
  })

  // Submit Vote
  socket.on(SOCKET_EVENTS.GAME_VOTE_SUBMIT, async ({ roomId, roundId, votedAnswerId }) => {
    try {
      console.log('[GAME HANDLERS] game:vote:submit event received:', { roomId, roundId, votedAnswerId })
      
      const result = await gameManager.submitVote(roomId, socket.data.userId, votedAnswerId)
      
      if (!result.success) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: result.error || 'Failed to submit vote' })
        return
      }

      // Emit success to user
      socket.emit(SOCKET_EVENTS.GAME_VOTE_SUBMITTED, { message: 'Vote submitted successfully', votedAnswerId: votedAnswerId })

      // Get current votes and emit to all players for live display
      const currentVotes = await gameManager.getCurrentVotes(roomId)
      const votesArray = Array.from(currentVotes.entries()).map(([userId, votedAnswerId]) => ({
        userId,
        votedAnswerId
      }))
      console.log('__________ votesArray __________', votesArray);
      io.to(roomId).emit(SOCKET_EVENTS.GAME_VOTES_UPDATE, {
        votes: votesArray,
        // votedCount: votesArray.length
      })

      console.log('[GAME HANDLERS] Vote submitted successfully for user:', socket.data.userId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error submitting vote:', error)
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Failed to submit vote' })
    }
  })

  // Get Game State
  socket.on(SOCKET_EVENTS.GAME_STATE_REQUEST, async ({ roomId }) => {
    try {
      console.log('[GAME HANDLERS] game:state:request event received for roomId:', roomId)
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          rounds: {
            include: {
              answers: true,
              votes: true
            }
          }
        }
      })
      console.log('__________ room __________', room);
      if (!room) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Room not found' })
        return
      }
      if (room.status === 'done') {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Game is finished' })
        return
      };
      const gameState = gameManager.getGameState(roomId)
      
      console.log('__________ gameState.currentRoundId __________', gameState);
      if (!gameState) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'No active game found' })
        return
      }
      const currentRound = room.rounds.find(round => round.id === gameState.currentRoundId) || null
      console.log('__________ currentRound __________', currentRound);
      // Get current answers and votes for live display
      const currentAnswers = await gameManager.getCurrentAnswers(roomId)
      const currentVotes = await gameManager.getCurrentVotes(roomId)
      console.log('__________ currentVotes __________', currentVotes);
      socket.emit(SOCKET_EVENTS.GAME_STATE_RESPONSE, {
        ...gameState,
        currentRound: currentRound,
        rounds: room.rounds,
        answers: Array.from(currentAnswers.entries()).map(([userId, answer]) => ({ userId, answer })),
        votes: Array.from(currentVotes.entries()).map(([userId, answerId]) => ({ userId, answerId }))
      })

      console.log('[GAME HANDLERS] Game state sent to user:', socket.data.userId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error getting game state:', error)
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Failed to get game state' })
    }
  })

  // Join Game Room
  socket.on(SOCKET_EVENTS.GAME_JOIN, async ({ roomId }) => {
    try {
      console.log('[GAME HANDLERS] game:join event received for roomId:', roomId)
      
      // Join the socket room
      await socket.join(roomId)
      
      // Get current game state if game is active
      const gameState = gameManager.getGameState(roomId)
      if (gameState) {
        // Send current game state to the joining player
        const currentAnswers = await gameManager.getCurrentAnswers(roomId)
        const currentVotes = await gameManager.getCurrentVotes(roomId)

        socket.emit(SOCKET_EVENTS.GAME_STATE_SYNC, {
          ...gameState,
          answers: Array.from(currentAnswers.entries()).map(([userId, answer]) => ({ userId, answer })),
          votes: Array.from(currentVotes.entries()).map(([userId, answerId]) => ({ userId, answerId }))
        })

        // If in answering phase, send current question
        if (gameState.status === 'answering') {
          socket.emit(SOCKET_EVENTS.GAME_ROUND_START, {
            roomId,
            roundId: gameState.currentRoundId,
            roundNumber: gameState.sno,
            question: gameState.currentQuestion || '',
            timeLeft: gameState.timeRemaining,
            timeTotal: gameState.timeRemaining
          })
        }

        // If in voting phase, send current voting state
        if (gameState.status === 'voting') {
          socket.emit(SOCKET_EVENTS.GAME_VOTING_START, {
            roomId,
            roundId: gameState.currentRoundId,
            answers: [], // Will be populated by answers update
            timeLeft: gameState.timeRemaining,
            timeTotal: gameState.timeRemaining
          })
        }
      }

      console.log('[GAME HANDLERS] User joined game room:', socket.data.userId, 'room:', roomId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error joining game room:', error)
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Failed to join game room' })
    }
  })

  // Leave Game Room
  socket.on(SOCKET_EVENTS.GAME_LEAVE, async ({ roomId }) => {
    try {
      console.log('[GAME HANDLERS] game:leave event received for roomId:', roomId)
      
      // Leave the socket room
      await socket.leave(roomId)
      
      console.log('[GAME HANDLERS] User left game room:', socket.data.userId, 'room:', roomId)
    } catch (error) {
      console.error('[GAME HANDLERS] Error leaving game room:', error)
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Failed to leave game room' })
    }
  })

  // // sync game state
  // socket.on(SOCKET_EVENTS.GAME_STATE_SYNCING, async ({ roomId }) => {
  //   try {
  //     const gameState = gameManager.getGameState(roomId)
  //     console.log('__________ gameState __________', gameState);
  //     if (gameState) {
  //       socket.emit(SOCKET_EVENTS.GAME_STATE_SYNC, {
  //         ...gameState,
  //       })
  //     }
  //     console.log('[GAME HANDLERS] game:state:sync event received for roomId:', roomId)
  //   } catch (error) {
  //     console.error('[GAME HANDLERS] Error syncing game state:', error)
  //   }
  // })

  // Handle disconnection
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log('[GAME HANDLERS] User disconnected from game:', socket.data.userId)
    // Clean up any game-related data if needed
  })
}

// Export function to emit game events from other parts of the system
export function emitGameEvent(roomId: string, event: keyof typeof SOCKET_EVENTS, data: unknown) {
  const io = getIO()
  if (io) {
    // Use proper typing for dynamic events
    const room = io.to(roomId)
    if (room && typeof room.emit === 'function') {
      room.emit(SOCKET_EVENTS[event], data)
    }
  }
}

export function emitGameStarted(roomId: string, data: { message: string; rounds: Array<Round> }) {
  const io = getIO()
  if (io) {
    io.to(roomId).emit(SOCKET_EVENTS.GAME_STARTED, data)
  }
}

export function emitGameStateUpdate(roomId: string, data: { status: string; currentRound: number; totalRounds: number }) {
  const io = getIO()
  if (io) {
    io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, data)
  }
}

export function emitGamePhaseUpdate(roomId: string, data: { type: string, timeLeft: number, timeTotal: number, totalRounds: number, roundSno: number }) {
  const io = getIO()
  if (io) {
    console.log('__________ game phase update', data);
    
    io.to(roomId).emit(SOCKET_EVENTS.GAME_PHASE_UPDATE, data)
  }
}

export function emitRoundStart(roomId: string, data: { roomId: string; roundId: string; roundNumber: number; question: string; timeLeft: number; timeTotal: number }): { success: boolean; clientCount: number } {
  const io = getIO()
  console.log('__________ emitRoundStart __________', data);
  
  if (!io) {
    console.error('Socket.IO instance not available')
    return { success: false, clientCount: 0 }
  }
  
  try {
    // Get the room and emit the event
    const room = io.to(roomId)
    
    // Get connected clients count for this room
    const connectedSockets = io.sockets.adapter.rooms.get(roomId)
    const clientCount = connectedSockets ? connectedSockets.size : 0
    
    if (clientCount === 0) {
      console.warn(`No clients connected to room ${roomId}`)
      return { success: false, clientCount: 0 }
    }
    
    // Emit the event
    room.emit(SOCKET_EVENTS.GAME_ROUND_START, data)
    
    console.log(`Event emitted successfully to ${clientCount} clients in room ${roomId}`)
    
    return { success: true, clientCount }
  } catch (error) {
    console.error('Failed to emit event:', error)
    return { success: false, clientCount: 0 }
  }
}

export function emitVotingStart(roomId: string, data: { roomId: string; roundId: string; answers: Array<{ id: string; content: string }>; timeLeft: number; timeTotal: number }) {
  const io = getIO()
  if (io) {
    io.to(roomId).emit(SOCKET_EVENTS.GAME_VOTING_START, data)
  }
}

// Export function to emit game end
export function emitGameEnd(roomId: string, gameResults: { roomId: string; finalScores?: Array<{ userId: string; points: number }> }) {
  emitGameEvent(roomId, 'GAME_ENDED', gameResults)
}