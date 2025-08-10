import type { Socket } from 'socket.io'
import type { SocketIOServer } from '@/types/socket'
import { SocketEvents, type JoinRoomPayload, type LeaveRoomPayload } from '@/types/socket'
import { getRoomState, joinRoom } from '@/actions/socket-state'
import { addOnline, removeOnline, getOnlineList, trackJoin, trackLeave } from '@/lib/presence'

export function registerRoomHandlers(io: SocketIOServer, socket: Socket) {
  // join_room
  
  socket.on(
    SocketEvents.JOIN_ROOM,
    async (payload: JoinRoomPayload, ack?: (res: { ok: boolean; data?: any; error?: string }) => void) => {
      console.log(' ______________ join_room ______________');
      const userId = (socket as any).data?.userId as string | undefined
      if (!userId) {
        ack?.({ ok: false, error: 'UNAUTHORIZED' })
        socket.emit(SocketEvents.ERROR, { message: 'Unauthorized', code: 'UNAUTHORIZED' })
        return
      }

      try {
        console.log('______ room Id', payload.roomId);
        
        const joined = await joinRoom(userId, payload.roomId)
        if (!joined.success) throw new Error(joined.error || 'Failed to join room')

        await socket.join(payload.roomId)
        // presence: mark user online in this room
        addOnline(payload.roomId, userId)
        trackJoin(socket.id, payload.roomId)

        const state = await getRoomState(payload.roomId)
        if (state.success) {
          io.to(payload.roomId).emit(SocketEvents.ROOM_UPDATED, {
            room: state.data,
            players: state.data.players,
            isHost: state.data.hostId === userId,
          })
          io.to(payload.roomId).emit(SocketEvents.PLAYER_JOINED, {
            userId,
            playersCount: state.data.players.length,
            playersOnline: getOnlineList(payload.roomId),
          })
          ack?.({ ok: true, data: { room: state.data } })
          return
        }
        ack?.({ ok: false, error: 'Failed to fetch room state' })
      } catch (e: any) {
        ack?.({ ok: false, error: e.message || 'Join failed' })
        socket.emit(SocketEvents.ERROR, { message: e.message || 'Join failed' })
      }
    }
  )

  // leave_room
  socket.on(
    SocketEvents.LEAVE_ROOM,
    async (payload: LeaveRoomPayload, ack?: (res: { ok: boolean; data?: any; error?: string }) => void) => {
      const userId = (socket as any).data?.userId as string | undefined
      if (!userId) return

      try {
        // Do NOT disconnect from DB membership; only leave socket room and update presence
        await socket.leave(payload.roomId)
        removeOnline(payload.roomId, userId)
        trackLeave(socket.id, payload.roomId)

        const state = await getRoomState(payload.roomId)
        if (state.success) {
          io.to(payload.roomId).emit(SocketEvents.ROOM_UPDATED, {
            room: state.data,
            players: state.data.players,
            isHost: state.data.hostId === userId,
          })
          io.to(payload.roomId).emit(SocketEvents.PLAYER_LEFT, {
            userId,
            playersCount: state.data.players.length,
            playersOnline: getOnlineList(payload.roomId),
          })
          ack?.({ ok: true })
          return
        }
        ack?.({ ok: false, error: 'Failed to fetch room state' })
      } catch (e: any) {
        ack?.({ ok: false, error: e.message || 'Leave failed' })
        socket.emit(SocketEvents.ERROR, { message: e.message || 'Leave failed' })
      }
    }
  )

  // sync_state
  socket.on('sync_state', async (_payload: any, ack?: (res: { ok: boolean; data?: any; error?: string }) => void) => {
    try {
      const userId = (socket as any).data?.userId as string | undefined
      if (!userId) {
        ack?.({ ok: false, error: 'UNAUTHORIZED' })
        return
      }
      // Try to infer current room from joined rooms (excluding own room id)
      const rooms = Array.from(socket.rooms || [])
      const currentRoomId = rooms.find((r) => r !== socket.id)
      if (!currentRoomId) {
        ack?.({ ok: true, data: { room: null, players: [], isHost: false } })
        return
      }
      const state = await getRoomState(currentRoomId)
      if (!state.success) {
        ack?.({ ok: false, error: state.error || 'Failed to fetch state' })
        return
      }
      ack?.({ ok: true, data: {
        room: state.data,
        players: state.data.players,
        isHost: state.data.hostId === userId,
        // Optionally include gamePhase/scores if your getRoomState returns them
      } })
    } catch (e: any) {
      ack?.({ ok: false, error: e.message || 'sync_state failed' })
    }
  })
}
