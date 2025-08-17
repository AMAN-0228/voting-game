/**
 * In-memory presence tracking with Redis-compatible interface
 */

interface PresenceData {
  userId: string
  username: string
  socketId: string
  joinedAt: number
}

class PresenceManager {
  private rooms: Map<string, Map<string, PresenceData>>

  constructor() {
    this.rooms = new Map()
  }

  /**
   * Add user to room
   */
  async addToRoom(roomId: string, data: PresenceData): Promise<void> {
    let room = this.rooms.get(roomId)
    if (!room) {
      room = new Map()
      this.rooms.set(roomId, room)
    }
    room.set(data.userId, data)
  }

  /**
   * Remove user from room
   */
  async removeFromRoom(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId)
    if (room) {
      room.delete(userId)
      if (room.size === 0) {
        this.rooms.delete(roomId)
      }
    }
  }

  /**
   * Get all users in room
   */
  async getRoomUsers(roomId: string): Promise<PresenceData[]> {
    const room = this.rooms.get(roomId)
    return room ? Array.from(room.values()) : []
  }

  /**
   * Check if user is in room
   */
  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId)
    return room ? room.has(userId) : false
  }

  /**
   * Get user count in room
   */
  async getRoomUserCount(roomId: string): Promise<number> {
    const room = this.rooms.get(roomId)
    return room ? room.size : 0
  }

  /**
   * Get user's presence data
   */
  async getUserPresence(roomId: string, userId: string): Promise<PresenceData | null> {
    const room = this.rooms.get(roomId)
    return room ? room.get(userId) || null : null
  }

  /**
   * Clear room data
   */
  async clearRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId)
  }

  /**
   * Get list of online users for a room
   */
  getOnlineList(roomId: string): Array<{ userId: string; username: string }> {
    const room = this.rooms.get(roomId)
    if (!room) return []
    
    return Array.from(room.values()).map(user => ({
      userId: user.userId,
      username: user.username
    }))
  }

  /**
   * Clear all presence data
   */
  async clearAll(): Promise<void> {
    this.rooms.clear()
  }
}

// Export singleton instance
export const presenceManager = new PresenceManager()

// Redis implementation would look like:
/*
class RedisPresenceManager {
  private redis: Redis

  constructor(redis: Redis) {
    this.redis = redis
  }

  async addToRoom(roomId: string, data: PresenceData): Promise<void> {
    await this.redis.hset(`room:${roomId}:presence`, data.userId, JSON.stringify(data))
  }

  async removeFromRoom(roomId: string, userId: string): Promise<void> {
    await this.redis.hdel(`room:${roomId}:presence`, userId)
  }

  async getRoomUsers(roomId: string): Promise<PresenceData[]> {
    const data = await this.redis.hgetall(`room:${roomId}:presence`)
    return Object.values(data).map(d => JSON.parse(d))
  }

  // ... other methods with Redis implementations
}
*/