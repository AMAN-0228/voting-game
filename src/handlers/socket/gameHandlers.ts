import type { Socket } from 'socket.io'
import type { SocketIOServer } from '@/types/socket'
import {
  SocketEvents,
  type StartGamePayload,
  type AnswerSubmitPayload,
  type StartVotingPayload,
  type CastVotePayload,
  type SyncStatePayload,
} from '@/types/socket'
import { getRoomState, getRoundAnswers, getRoomIdForRound, getScoresForRoom } from '@/actions/socket-state'
import { startRound } from '@/actions/rounds'
import { submitAnswer } from '@/actions/answers'
import { submitVote } from '@/actions/votes'
import { updateRoomStatus } from '@/actions/socket-state'

export function registerGameHandlers(io: SocketIOServer, socket: Socket) {
  // start_game (host only)
  socket.on(SocketEvents.START_GAME, async (payload: StartGamePayload) => {
    const userId = (socket as any).data?.userId as string | undefined
    if (!userId) return

    const state = await getRoomState(payload.roomId)
    if (!state.success) {
      socket.emit(SocketEvents.ERROR, { message: state.error || 'Room not found' })
      return
    }
    if (state.data.hostId !== userId) {
      socket.emit(SocketEvents.ERROR, { message: 'Only host can start the game', code: 'FORBIDDEN' })
      return
    }

    try {
      // Persist room status in DB via action (no direct Prisma in handlers)
      const statusUpdate = await updateRoomStatus(payload.roomId, 'in_progress')
      if (!statusUpdate.success) throw new Error(statusUpdate.error || 'Failed to update room status')

      // Create first round
      const round = await startRound(userId, { roomId: payload.roomId })
      if (!round.success) throw new Error(round.error || 'Failed to start round')

      io.to(payload.roomId).emit(SocketEvents.GAME_STARTED, {
        roomId: payload.roomId,
        gamePhase: 'answering' as const,
        message: 'Game has started! Get ready for the first question.',
      })

      io.to(payload.roomId).emit(SocketEvents.ANSWERING_PHASE_STARTED, {
        roomId: payload.roomId,
        roundId: round.data.id,
        question: round.data.question,
      })
    } catch (e: any) {
      socket.emit(SocketEvents.ERROR, { message: e.message || 'Start game failed' })
    }
  })

  // answer_submit (anonymous broadcast)
  socket.on(SocketEvents.ANSWER_SUBMIT, async (payload: AnswerSubmitPayload) => {
    const userId = (socket as any).data?.userId as string | undefined
    if (!userId) return

    const result = await submitAnswer(userId, payload)
    if (!result.success) {
      socket.emit(SocketEvents.ERROR, { message: result.error || 'Failed to submit answer' })
      return
    }

    const answers = await getRoundAnswers(payload.roundId)
    // Determine room to scope the broadcast
    const roomForRound = await getRoomIdForRound(payload.roundId)
    const roomId = roomForRound.success && roomForRound.data ? roomForRound.data.roomId : null
    const total = answers.success && Array.isArray(answers.data) ? answers.data.length : 0
    if (roomId) {
      io.to(roomId).emit(SocketEvents.ANSWER_RECEIVED, {
        roundId: payload.roundId,
        totalAnswers: total,
      })
    } else {
      // Fallback (should rarely happen)
      socket.emit(SocketEvents.ERROR, { message: 'Unable to resolve room for round' })
    }
  })

  // start_voting (host only; requires roundId)
  socket.on(SocketEvents.START_VOTING, async (payload: StartVotingPayload) => {
    const userId = (socket as any).data?.userId as string | undefined
    if (!userId) return

    if (!payload.roundId) {
      socket.emit(SocketEvents.ERROR, { message: 'roundId is required to start voting', code: 'VALIDATION_ERROR' })
      return
    }

    const roomForRound = await getRoomIdForRound(payload.roundId)
    if (!roomForRound.success || !roomForRound.data) {
      socket.emit(SocketEvents.ERROR, { message: roomForRound.error || 'Round not found' })
      return
    }

    const state = await getRoomState(roomForRound.data.roomId)
    if (!state.success) return
    if (state.data.hostId !== userId) {
      socket.emit(SocketEvents.ERROR, { message: 'Only host can start voting', code: 'FORBIDDEN' })
      return
    }

    const answers = await getRoundAnswers(payload.roundId)
    if (!answers.success || !answers.data) {
      socket.emit(SocketEvents.ERROR, { message: answers.error || 'Failed to fetch answers' })
      return
    }

    io.to(roomForRound.data.roomId).emit(SocketEvents.VOTING_PHASE_STARTED, {
      roomId: roomForRound.data.roomId,
      roundId: payload.roundId,
      answers: answers.data,
    })
  })

  // cast_vote -> update scores broadcast
  socket.on(SocketEvents.CAST_VOTE, async (payload: CastVotePayload) => {
    const userId = (socket as any).data?.userId as string | undefined
    if (!userId) return

    const result = await submitVote(userId, payload)
    if (!result.success) {
      socket.emit(SocketEvents.ERROR, { message: result.error || 'Failed to cast vote' })
      return
    }

    const room = await getRoomIdForRound(payload.roundId)
    if (!room.success || !room.data) return

    const scores = await getScoresForRoom(room.data.roomId)
    if (scores.success && scores.data) {
      io.to(room.data.roomId).emit(SocketEvents.SCORES_UPDATED, {
        roomId: room.data.roomId,
        scores: scores.data,
      })
    }
  })

  // sync_state for reconnect
  socket.on(SocketEvents.SYNC_STATE, async (payload: SyncStatePayload) => {
    const state = await getRoomState(payload.roomId)
    if (!state.success) {
      socket.emit(SocketEvents.ERROR, { message: state.error || 'Failed to sync state' })
      return
    }
    socket.emit(SocketEvents.ROOM_UPDATED, {
      room: state.data,
      players: state.data.players,
      isHost: state.data.hostId === (socket as any).data?.userId,
    })
  })
}
