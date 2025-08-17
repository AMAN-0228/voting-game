import type { Socket } from 'socket.io'
import type { SocketIOServer } from '@/types/socket'
import { SOCKET_EVENTS } from '@/constants/api-routes'

// Placeholder for lobby-wide broadcasts such as lobby list updates, etc.
// Currently, roomHandlers emits PLAYER_JOINED/PLAYER_LEFT scoped to rooms.
// Extend here if you plan a global lobby room.
export function registerLobbyHandlers(io: SocketIOServer, socket: Socket) {
  // Example: join a global lobby channel for announcements
  // socket.join('lobby')

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    // No-op for now; roomHandlers handles player leave events per room
  })
}
