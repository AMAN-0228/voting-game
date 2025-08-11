// In-memory presence tracking (not persisted)
// Tracks which users are online per room and which rooms a socket is in

interface OnlineUser {
  id: string
  name?: string | null
  email?: string | null
}

const onlineUsersByRoom = new Map<string, Set<string>>()
const roomsBySocket = new Map<string, Set<string>>()
const userInfoBySocket = new Map<string, OnlineUser>()

export function addOnline(roomId: string, userId: string, userInfo?: { name?: string | null; email?: string | null }) {
  let set = onlineUsersByRoom.get(roomId)
  if (!set) {
    set = new Set<string>()
    onlineUsersByRoom.set(roomId, set)
  }
  set.add(userId)
  
  // Store user info if provided
  if (userInfo) {
    userInfoBySocket.set(userId, {
      id: userId,
      name: userInfo.name,
      email: userInfo.email
    })
  }
}

export function removeOnline(roomId: string, userId: string) {
  const set = onlineUsersByRoom.get(roomId)
  if (!set) return
  set.delete(userId)
  if (set.size === 0) onlineUsersByRoom.delete(roomId)
  
  // Check if user is still online in any other room
  let stillOnline = false
  for (const [_, roomSet] of onlineUsersByRoom) {
    if (roomSet.has(userId)) {
      stillOnline = true
      break
    }
  }
  
  // Remove user info if they're no longer online anywhere
  if (!stillOnline) {
    userInfoBySocket.delete(userId)
  }
}

export function getOnlineList(roomId: string): string[] {
  const set = onlineUsersByRoom.get(roomId)
  return set ? Array.from(set) : []
}

export function getUserInfo(userId: string): OnlineUser | null {
  return userInfoBySocket.get(userId) || null
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
