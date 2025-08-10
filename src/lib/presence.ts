// In-memory presence tracking (not persisted)
// Tracks which users are online per room and which rooms a socket is in

const onlineUsersByRoom = new Map<string, Set<string>>()
const roomsBySocket = new Map<string, Set<string>>()

export function addOnline(roomId: string, userId: string) {
  let set = onlineUsersByRoom.get(roomId)
  if (!set) {
    set = new Set<string>()
    onlineUsersByRoom.set(roomId, set)
  }
  set.add(userId)
}

export function removeOnline(roomId: string, userId: string) {
  const set = onlineUsersByRoom.get(roomId)
  if (!set) return
  set.delete(userId)
  if (set.size === 0) onlineUsersByRoom.delete(roomId)
}

export function getOnlineList(roomId: string): string[] {
  const set = onlineUsersByRoom.get(roomId)
  return set ? Array.from(set) : []
}

export function trackJoin(socketId: string, roomId: string) {
  let set = roomsBySocket.get(socketId)
  if (!set) {
    set = new Set<string>()
    roomsBySocket.set(socketId, set)
  }
  set.add(roomId)
}

export function trackLeave(socketId: string, roomId: string) {
  const set = roomsBySocket.get(socketId)
  if (!set) return
  set.delete(roomId)
  if (set.size === 0) roomsBySocket.delete(socketId)
}

export function roomsForSocket(socketId: string): string[] {
  const set = roomsBySocket.get(socketId)
  return set ? Array.from(set) : []
}
