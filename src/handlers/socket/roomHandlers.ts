import type { Socket } from 'socket.io'
import type { SocketIOServer } from '@/types/socket'
import { SocketEvents, type JoinRoomPayload, type LeaveRoomPayload } from '@/types/socket'
import { getRoomState, joinRoom } from '@/actions/socket-state'
import { addOnline, removeOnline, getOnlineList, trackJoin, trackLeave } from '@/lib/presence'

export function registerRoomHandlers(io: SocketIOServer, socket: Socket) {
  
  // leave_room
  socket.on(
    SocketEvents.LEAVE_ROOM,
    async (payload: LeaveRoomPayload, ack?: (res: { ok: boolean; data?: any; error?: string }) => void) => {
      const userId = (socket as any).data?.userId as string | undefined
      if (!userId) return

      try {
        // Do NOT disconnect from DB membership; only leave socket room and update presence
        await socket.leave(payload.roomId)
        
        // Get user info before removing
        const userInfo = {
          name: (socket as any).data?.name,
          email: (socket as any).data?.email
        }
        
        removeOnline(payload.roomId, userId)
        trackLeave(socket.id, payload.roomId)

        const state = await getRoomState(payload.roomId)
        if (state.success) {
          io.to(payload.roomId).emit(SocketEvents.ROOM_UPDATED, {
            room: state.data,
            players: state.data.players,
            isHost: state.data.hostId === userId,
          })
          
          // Broadcast player_left event with user info and updated online list
          io.to(payload.roomId).emit(SocketEvents.PLAYER_LEFT, {
            roomId: payload.roomId,
            userId,
            user: { id: userId, name: userInfo.name, email: userInfo.email },
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
