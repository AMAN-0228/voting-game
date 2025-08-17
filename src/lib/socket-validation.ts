import type { Socket } from 'socket.io'
import { prisma } from './prisma'
import { timerManager } from './timer-manager'
import { voteManager } from './vote-manager'
import type { 
  RoomValidation, 
  AnswerValidation, 
  VoteValidation,
  GamePhase 
} from '@/types/socket-events'

/**
 * Validate room membership and current phase
 */
export async function validateRoom(socket: Socket, roomId: string): Promise<RoomValidation> {
  // Check socket is in room
  if (!socket.rooms.has(roomId)) {
    throw new Error('Not in room')
  }

  // Get room state from DB
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      rounds: {
        where: { 
          OR: [
            { status: 'active' },
            { status: 'voting' }
          ]
        },
        orderBy: { sno: 'desc' },
        take: 1
      }
    }
  })

  if (!room) {
    throw new Error('Room not found')
  }

  // Determine current phase
  let currentPhase: GamePhase = 'lobby'
  if (room.status === 'in_progress') {
    const currentRound = room.rounds[0]
    if (currentRound) {
      currentPhase = currentRound.status === 'voting' ? 'voting' : 'answering'
    }
  } else if (room.status === 'done') {
    currentPhase = 'results'
  }

  return {
    roomId,
    userId: socket.data.userId,
    isHost: room.hostId === socket.data.userId,
    currentPhase,
    isAnsweringPhase: currentPhase === 'answering',
    isVotingPhase: currentPhase === 'voting'
  }
}

/**
 * Validate answer submission eligibility
 */
export async function validateAnswer(
  roomId: string, 
  roundId: string, 
  userId: string
): Promise<AnswerValidation> {
  const [round, existingAnswer] = await Promise.all([
    prisma.round.findUnique({ where: { id: roundId } }),
    prisma.answer.findFirst({ 
      where: { roundId, userId }
    })
  ])

  if (!round) {
    throw new Error('Round not found')
  }

  return {
    hasAnswered: !!existingAnswer,
    isAnsweringPhase: round.status === 'active',
    timeLeft: timerManager.getTimeLeft(roomId)
  }
}

/**
 * Validate vote submission eligibility
 */
export async function validateVote(
  roomId: string,
  roundId: string,
  userId: string,
  answerId: string
): Promise<VoteValidation> {
  const [round, answer] = await Promise.all([
    prisma.round.findUnique({ where: { id: roundId } }),
    prisma.answer.findUnique({ where: { id: answerId } })
  ])

  if (!round) {
    throw new Error('Round not found')
  }

  if (!answer) {
    throw new Error('Answer not found')
  }

  return {
    hasVoted: voteManager.hasVoted(roomId, answerId, userId),
    isVotingPhase: round.status === 'voting',
    timeLeft: timerManager.getTimeLeft(roomId),
    isOwnAnswer: answer.userId === userId
  }
}

/**
 * Middleware to ensure user is authenticated
 */
export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  const userId = socket.handshake.auth.userId
  const username = socket.handshake.auth.username

  if (!userId || !username) {
    return next(new Error('Authentication required'))
  }

  socket.data.userId = userId
  socket.data.username = username
  next()
}

/**
 * Middleware to log socket events
 */
export function loggerMiddleware(socket: Socket, next: (err?: Error) => void) {
  // Log all events
  const originalEmit = socket.emit
  socket.emit = function(ev: string, ...args: unknown[]) {
    console.log(`[${socket.id}] Emit: ${ev}`, args)
    return originalEmit.apply(this, [ev, ...args])
  }
  next()
}

/**
 * Error handler for socket events
 */
export function errorHandler(socket: Socket, error: Error) {
  console.error(`[${socket.id}] Error:`, error)
  socket.emit('game:error', { message: error.message })
}
