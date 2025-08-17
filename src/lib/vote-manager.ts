/**
 * In-memory vote tracking with Redis-compatible interface
 */

interface VoteData {
  answerId: string
  voterIds: Set<string>
  timestamp: number
}

interface VoteTally {
  answerId: string
  voteCount: number
}

class VoteManager {
  private votes: Map<string, Map<string, VoteData>>

  constructor() {
    this.votes = new Map()
  }

  /**
   * Add vote for an answer
   */
  async addVote(roomId: string, answerId: string, voterId: string): Promise<void> {
    let roomVotes = this.votes.get(roomId)
    if (!roomVotes) {
      roomVotes = new Map()
      this.votes.set(roomId, roomVotes)
    }

    let voteData = roomVotes.get(answerId)
    if (!voteData) {
      voteData = {
        answerId,
        voterIds: new Set(),
        timestamp: Date.now()
      }
      roomVotes.set(answerId, voteData)
    }

    voteData.voterIds.add(voterId)
  }

  /**
   * Check if user has voted for an answer
   */
  hasVoted(roomId: string, answerId: string, voterId: string): boolean {
    const roomVotes = this.votes.get(roomId)
    if (!roomVotes) return false

    const voteData = roomVotes.get(answerId)
    return voteData ? voteData.voterIds.has(voterId) : false
  }

  /**
   * Get vote count for an answer
   */
  async getVoteCount(roomId: string, answerId: string): Promise<number> {
    const roomVotes = this.votes.get(roomId)
    if (!roomVotes) return 0

    const voteData = roomVotes.get(answerId)
    return voteData ? voteData.voterIds.size : 0
  }

  /**
   * Get all votes for a room
   */
  async getRoomVotes(roomId: string): Promise<Array<{
    answerId: string
    voterIds: string[]
    timestamp: number
  }>> {
    const roomVotes = this.votes.get(roomId)
    if (!roomVotes) return []

    return Array.from(roomVotes.values()).map(vote => ({
      answerId: vote.answerId,
      voterIds: Array.from(vote.voterIds),
      timestamp: vote.timestamp
    }))
  }

  /**
   * Get vote summary for a room
   */
  async getVoteSummary(roomId: string): Promise<VoteTally[]> {
    const roomVotes = this.votes.get(roomId)
    if (!roomVotes) return []

    return Array.from(roomVotes.entries()).map(([answerId, data]) => ({
      answerId,
      voteCount: data.voterIds.size
    }))
  }

  /**
   * Clear votes for a room
   */
  async clearRoom(roomId: string): Promise<void> {
    this.votes.delete(roomId)
  }

  /**
   * Clear all vote data
   */
  async clearAll(): Promise<void> {
    this.votes.clear()
  }
}

// Export singleton instance
export const voteManager = new VoteManager()

// Redis implementation would look like:
/*
class RedisVoteManager {
  private redis: Redis

  constructor(redis: Redis) {
    this.redis = redis
  }

  async addVote(roomId: string, answerId: string, voterId: string): Promise<void> {
    await this.redis.sadd(`room:${roomId}:answer:${answerId}:votes`, voterId)
    await this.redis.zadd(`room:${roomId}:votes`, Date.now(), answerId)
  }

  async hasVoted(roomId: string, answerId: string, voterId: string): Promise<boolean> {
    return this.redis.sismember(`room:${roomId}:answer:${answerId}:votes`, voterId)
  }

  async getVoteCount(roomId: string, answerId: string): Promise<number> {
    return this.redis.scard(`room:${roomId}:answer:${answerId}:votes`)
  }

  // ... other methods with Redis implementations
}
*/