import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { generateQuestions } from '@/lib/question-service'
import { timerManager } from '@/lib/timer-manager'
import { voteManager } from '@/lib/vote-manager'
import { presenceManager } from '@/lib/presence'
import { SOCKET_EVENTS } from '@/constants/api-routes'

// Constants for game phases
const ANSWERING_TIME = 120 // 2 minutes
const VOTING_TIME = 60 // 1 minute

/**
 * Start a new game for a room
 */
export async function startGame(io: SocketIOServer, roomId: string, numRounds: number) {
  try {
    // Generate questions using Gemini
    const questions = await generateQuestions(numRounds)

    // Create rounds in DB
    const rounds = await prisma.$transaction(
      questions.map((question, index) =>
        prisma.round.create({
          data: {
            roomId,
            question,
            sno: index + 1,
            status: 'pending'
          }
        })
      )
    )

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'in_progress' }
    })

    // Emit game started event
    io.to(roomId).emit(SOCKET_EVENTS.GAME_STARTED, {
      roomId,
      totalRounds: numRounds,
      rounds: rounds.map(r => ({ id: r.id, roundNumber: r.sno }))
    })

    // Start first round
    await startRound(io, roomId, rounds[0].id)

    return { success: true, rounds }
  } catch (error) {
    console.error('Error starting game:', error)
    throw error
  }
}

/**
 * Start a specific round
 */
export async function startRound(io: SocketIOServer, roomId: string, roundId: string) {
  try {
    // Get round details
    const round = await prisma.round.update({
      where: { id: roundId },
      data: { status: 'active' }
    })

    if (!round) {
      throw new Error('Round not found')
    }

    // Emit round started event
    io.to(roomId).emit(SOCKET_EVENTS.ROUND_STARTED, {
      roomId,
      roundId: round.id,
      roundNumber: round.sno,
      question: round.question,
      timeLeft: ANSWERING_TIME,
      timeTotal: ANSWERING_TIME
    })

    // Start answering phase timer
    timerManager.startTimer({
      roomId,
      roundId,
      phase: 'answering',
      totalTime: ANSWERING_TIME,
      onEnd: () => endAnsweringPhase(io, roomId, roundId)
    })

    return { success: true }
  } catch (error) {
    console.error('Error starting round:', error)
    throw error
  }
}

/**
 * End answering phase and begin voting
 */
export async function endAnsweringPhase(io: SocketIOServer, roomId: string, roundId: string) {
  try {
    // Emit answering ended event
    io.to(roomId).emit(SOCKET_EVENTS.ANSWERING_ENDED, {
      roomId,
      roundId
    })

    // Get all answers for the round
    const answers = await prisma.answer.findMany({
      where: { roundId },
      select: {
        id: true,
        content: true,
        userId: true
      }
    })

    // Shuffle answers to anonymize
    const shuffledAnswers = answers
      .map(a => ({ ...a }))
      .sort(() => Math.random() - 0.5)

    // Update round status
    await prisma.round.update({
      where: { id: roundId },
      data: { status: 'voting' }
    })

    // Emit voting started event
    io.to(roomId).emit(SOCKET_EVENTS.VOTING_STARTED, {
      roomId,
      roundId,
      answers: shuffledAnswers.map(a => ({
        id: a.id,
        content: a.content
      })),
      timeLeft: VOTING_TIME,
      timeTotal: VOTING_TIME
    })

    // Start voting phase timer
    timerManager.startTimer({
      roomId,
      roundId,
      phase: 'voting',
      totalTime: VOTING_TIME,
      onEnd: () => endVotingPhase(io, roomId, roundId)
    })

    return { success: true }
  } catch (error) {
    console.error('Error ending answering phase:', error)
    throw error
  }
}

/**
 * End voting phase, persist votes, update scores
 */
export async function endVotingPhase(io: SocketIOServer, roomId: string, roundId: string) {
  try {
    // Get all votes from vote manager
    const votes = voteManager.getAllVotesForRoom(roomId)
    const voteTallies = voteManager.getVoteSummary(roomId)

    // Persist votes to DB in a transaction
    await prisma.$transaction(async (tx) => {
      // Create all votes
      await tx.vote.createMany({
        data: votes.flatMap(v => 
          v.voterIds.map(voterId => ({
            roundId,
            answerId: v.answerId,
            voterId
          }))
        )
      })

      // Get answers with their authors
      const answers = await tx.answer.findMany({
        where: { roundId },
        select: { id: true, userId: true }
      })

      // Calculate points per user
      const pointsPerUser = new Map<string, number>()
      for (const answer of answers) {
        const voteCount = voteTallies.find(t => t.answerId === answer.id)?.voteCount || 0
        const points = pointsPerUser.get(answer.userId) || 0
        pointsPerUser.set(answer.userId, points + voteCount)
      }

      // Update scores
      for (const [userId, points] of pointsPerUser.entries()) {
        // Find existing score
        const existingScore = await tx.score.findFirst({
          where: { userId, roomId }
        })

        if (existingScore) {
          await tx.score.update({
            where: { id: existingScore.id },
            data: { points: existingScore.points + points }
          })
        } else {
          await tx.score.create({
            data: { userId, roomId, points }
          })
        }
      }

      // Update round status
      await tx.round.update({
        where: { id: roundId },
        data: { status: 'finished' }
      })
    })

    // Emit voting ended event
    io.to(roomId).emit(SOCKET_EVENTS.VOTING_ENDED, {
      roomId,
      roundId,
      tallies: voteTallies
    })

    // Get updated scores
    const scores = await prisma.score.findMany({
      where: { roomId },
      select: {
        userId: true,
        points: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Emit scores updated event
    io.to(roomId).emit(SOCKET_EVENTS.SCORES_UPDATED, {
      roomId,
      scores: scores.map(s => ({
        userId: s.userId,
        points: s.points,
        user: s.user
      }))
    })

    // Clear votes for this room
    voteManager.clearRoom(roomId)

    // Check if this was the last round
    const nextRound = await prisma.round.findFirst({
      where: {
        roomId,
        status: 'pending'
      },
      orderBy: {
        sno: 'asc'
      }
    })

    if (nextRound) {
      // Start next round
      await startRound(io, roomId, nextRound.id)
    } else {
      // End game
      await endGame(io, roomId)
    }

    return { success: true }
  } catch (error) {
    console.error('Error ending voting phase:', error)
    throw error
  }
}

/**
 * End the game and clean up
 */
export async function endGame(io: SocketIOServer, roomId: string) {
  try {
    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'done' }
    })

    // Get final scores
    const finalScores = await prisma.score.findMany({
      where: { roomId },
      select: {
        userId: true,
        points: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      }
    })

    // Emit game ended event
    io.to(roomId).emit(SOCKET_EVENTS.GAME_ENDED, {
      roomId,
      finalScores: finalScores.map(s => ({
        userId: s.userId,
        points: s.points,
        user: s.user
      }))
    })

    // Clear any remaining timers
    timerManager.clearTimer(roomId)

    return { success: true }
  } catch (error) {
    console.error('Error ending game:', error)
    throw error
  }
}

/**
 * Submit an answer for a round
 */
export async function submitAnswer(roomId: string, roundId: string, userId: string, content: string) {
  try {
    // Validate round is in answering phase
    const round = await prisma.round.findUnique({
      where: { id: roundId }
    })

    if (!round || round.status !== 'active') {
      throw new Error('Round is not in answering phase')
    }

    // Check if user already answered
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        roundId,
        userId
      }
    })

    if (existingAnswer) {
      throw new Error('User has already submitted an answer for this round')
    }

    // Create answer
    const answer = await prisma.answer.create({
      data: {
        roundId,
        userId,
        content: content.trim()
      }
    })

    return { success: true, answer }
  } catch (error) {
    console.error('Error submitting answer:', error)
    throw error
  }
}

/**
 * Submit a vote for an answer
 */
export async function submitVote(io: SocketIOServer, roomId: string, roundId: string, answerId: string, voterId: string) {
  try {
    // Validate round is in voting phase
    const round = await prisma.round.findUnique({
      where: { id: roundId }
    })

    if (!round || round.status !== 'voting') {
      throw new Error('Round is not in voting phase')
    }

    // Get answer to validate it exists and user isn't voting for their own
    const answer = await prisma.answer.findUnique({
      where: { id: answerId }
    })

    if (!answer) {
      throw new Error('Answer not found')
    }

    if (answer.userId === voterId) {
      throw new Error('Cannot vote for your own answer')
    }

    // Check if user already voted
    if (voteManager.hasVoted(roomId, answerId, voterId)) {
      throw new Error('User has already voted for this answer')
    }

    // Add vote to in-memory manager
    voteManager.addVote(roomId, answerId, voterId)

    // Get updated vote count
    const voteCount = voteManager.getVoteCount(roomId, answerId)

    // Emit vote update
    io.to(roomId).emit(SOCKET_EVENTS.VOTE_UPDATE, {
      roomId,
      roundId,
      answerId,
      voteCount
    })

    return { success: true }
  } catch (error) {
    console.error('Error submitting vote:', error)
    throw error
  }
}

/**
 * Get current game state for a room
 */
export async function getGameState(roomId: string, userId: string) {
  try {
    // Get room with current round and players
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        rounds: {
          where: {
            OR: [
              { status: 'active' },
              { status: 'voting' }
            ]
          }
        },
        scores: true
      }
    })

    if (!room) {
      throw new Error('Room not found')
    }

    // Get player details
    const players = await prisma.user.findMany({
      where: { id: { in: room.playerIds } },
      select: { id: true, name: true, email: true }
    })

    if (!room) {
      throw new Error('Room not found')
    }

    // Get current timer state
    const timerState = timerManager.getTimerState(roomId)

    // Get online players
    const playersOnline = presenceManager.getOnlineList(roomId)

    return {
      room: {
        ...room,
        players
      },
      isHost: room.hostId === userId,
      currentRound: room.rounds[0] || null,
      scores: room.scores,
      gamePhase: timerState?.phase || 'waiting',
      timeLeft: timerState?.timeLeft || 0,
      playersOnline
    }
  } catch (error) {
    console.error('Error getting game state:', error)
    throw error
  }
}
