import { VoteManager } from './vote-manager'

describe('VoteManager', () => {
  let voteManager: VoteManager

  beforeEach(() => {
    voteManager = new VoteManager()
  })

  describe('addVote', () => {
    it('should add a new vote successfully', () => {
      const result = voteManager.addVote('room1', 'answer1', 'voter1')
      expect(result).toBe(true)
      expect(voteManager.getVoteCount('room1', 'answer1')).toBe(1)
    })

    it('should prevent duplicate votes from same voter', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      const result = voteManager.addVote('room1', 'answer1', 'voter1')
      expect(result).toBe(false)
      expect(voteManager.getVoteCount('room1', 'answer1')).toBe(1)
    })

    it('should allow same voter to vote for different answers', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      const result = voteManager.addVote('room1', 'answer2', 'voter1')
      expect(result).toBe(true)
      expect(voteManager.getVoteCount('room1', 'answer1')).toBe(1)
      expect(voteManager.getVoteCount('room1', 'answer2')).toBe(1)
    })
  })

  describe('getVotes', () => {
    it('should return empty map for non-existent room', () => {
      const votes = voteManager.getVotes('nonexistent')
      expect(votes.size).toBe(0)
    })

    it('should return correct votes for room', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      voteManager.addVote('room1', 'answer1', 'voter2')
      voteManager.addVote('room1', 'answer2', 'voter3')

      const votes = voteManager.getVotes('room1')
      expect(votes.get('answer1')?.size).toBe(2)
      expect(votes.get('answer2')?.size).toBe(1)
    })
  })

  describe('getVoteCount', () => {
    it('should return 0 for non-existent room', () => {
      expect(voteManager.getVoteCount('nonexistent', 'answer1')).toBe(0)
    })

    it('should return 0 for non-existent answer', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      expect(voteManager.getVoteCount('room1', 'nonexistent')).toBe(0)
    })

    it('should return correct vote count', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      voteManager.addVote('room1', 'answer1', 'voter2')
      expect(voteManager.getVoteCount('room1', 'answer1')).toBe(2)
    })
  })

  describe('hasVoted', () => {
    it('should return false for non-existent room', () => {
      expect(voteManager.hasVoted('nonexistent', 'answer1', 'voter1')).toBe(false)
    })

    it('should return false for non-existent answer', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      expect(voteManager.hasVoted('room1', 'nonexistent', 'voter1')).toBe(false)
    })

    it('should return true for existing vote', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      expect(voteManager.hasVoted('room1', 'answer1', 'voter1')).toBe(true)
    })
  })

  describe('clearRoom', () => {
    it('should remove all votes for a room', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      voteManager.addVote('room1', 'answer2', 'voter2')
      voteManager.addVote('room2', 'answer1', 'voter1')

      voteManager.clearRoom('room1')

      expect(voteManager.getVoteCount('room1', 'answer1')).toBe(0)
      expect(voteManager.getVoteCount('room1', 'answer2')).toBe(0)
      expect(voteManager.getVoteCount('room2', 'answer1')).toBe(1)
    })
  })

  describe('getAllVotesForRoom', () => {
    it('should return empty array for non-existent room', () => {
      expect(voteManager.getAllVotesForRoom('nonexistent')).toEqual([])
    })

    it('should return all votes for room', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      voteManager.addVote('room1', 'answer1', 'voter2')
      voteManager.addVote('room1', 'answer2', 'voter3')

      const votes = voteManager.getAllVotesForRoom('room1')
      expect(votes).toHaveLength(2)
      expect(votes).toContainEqual({
        answerId: 'answer1',
        voterIds: ['voter1', 'voter2']
      })
      expect(votes).toContainEqual({
        answerId: 'answer2',
        voterIds: ['voter3']
      })
    })
  })

  describe('getVoteSummary', () => {
    it('should return empty array for non-existent room', () => {
      expect(voteManager.getVoteSummary('nonexistent')).toEqual([])
    })

    it('should return vote counts for room', () => {
      voteManager.addVote('room1', 'answer1', 'voter1')
      voteManager.addVote('room1', 'answer1', 'voter2')
      voteManager.addVote('room1', 'answer2', 'voter3')

      const summary = voteManager.getVoteSummary('room1')
      expect(summary).toHaveLength(2)
      expect(summary).toContainEqual({
        answerId: 'answer1',
        voteCount: 2
      })
      expect(summary).toContainEqual({
        answerId: 'answer2',
        voteCount: 1
      })
    })
  })
})
