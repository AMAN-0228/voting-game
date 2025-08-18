import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface RoundSummaryData {
  id: string
  sno: number
  question: string
  status: string
  createdAt: Date
  answers: Array<{
    id: string
    content: string
    userId: string
    userName: string
    voteCount: number
    voters: Array<{
      id: string
      name: string
    }>
  }>
  WinningAnswers: Array<{
    id: string
    content: string
    userId: string
    userName: string
    voteCount: number
    voters: Array<{
      id: string
      name: string
    }>
  }> | null
  winningAnswerIds: Array<string> | []
  // ... other fields
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * Get detailed round summary for a room
 * Includes answers, votes, winners, and user voting history
 */
export async function getRoundSummary(roomId: string, userId: string): Promise<ActionResult<RoundSummaryData[]>> {
  try {
    // Check if user is a member of the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { playerIds: true }
    })

    if (!room) {
      return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    }

    if (!room.playerIds.includes(userId)) {
      return { success: false, error: 'Not a member of this room', code: 'FORBIDDEN' }
    }

    // Get all rounds for this room with detailed information
    const rounds = await prisma.round.findMany({
      where: { roomId },
      include: {
        answers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            },
            votes: {
              include: {
                voter: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        votes: {
          include: {
            voter: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            answer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { sno: 'asc' }
    })
    // console.dir(rounds, { depth: null })
    // Transform the data to include vote counts and winners
    const transformedRounds = rounds.map(round => {
      // Calculate vote counts for each answer
      const answerVoteCounts = round.answers?.map(answer => ({
        id: answer.id,
        content: answer.content,
        userId: answer.userId,
        userName: answer.user.name,
        voteCount: answer.votes?.length || 0,
        voters: answer.votes?.map(vote => ({
          id: vote.voter.id,
          name: vote.voter.name 
        }))
      })) || []

      // Find the winning answer (most votes)
      const winningAnswerIds: string[] = []
      const WinningAnswers = answerVoteCounts.length > 0 ? (() => {
        const maxVotes = Math.max(...answerVoteCounts.map(a => a.voteCount));
        const filteredAnswers = answerVoteCounts.filter(a => a.voteCount === maxVotes);
        filteredAnswers.forEach(a => winningAnswerIds.push(a.id));
        return filteredAnswers;
      })() : null;

      // Get user's vote for this round
      const userVote = round.votes?.find(vote => vote.voterId === userId)

      return {
        id: round.id,
        sno: round.sno,
        question: round.question,
        status: round.status,
        createdAt: round.createdAt,
        answers: answerVoteCounts,
        WinningAnswers,
        winningAnswerIds,
        userVote: userVote ? {
          answerId: userVote.answerId,
          answerContent: userVote.answer.content,
          votedForUser: userVote.answer.user.name || userVote.answer.user.email
        } : null,
        totalVotes: round.votes?.length || 0
      }
    })

    return {
      success: true,
      data: transformedRounds as RoundSummaryData[]
    }

  } catch (error) {
    console.error('Error fetching round summary:', error)
    return { 
      success: false, 
      error: 'Internal server error', 
      code: 'INTERNAL_ERROR' 
    }
  }
}

/**
 * Get rounds for a room (basic info)
 */
export async function getRoundsByRoom(roomId: string, userId: string): Promise<ActionResult<Array<{
  id: string
  question: string
  sno: number
  status: string
  createdAt: Date
}>>> {
  try {
    // Check if user is a member of the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { playerIds: true }
    })

    if (!room) {
      return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    }

    if (!room.playerIds.includes(userId)) {
      return { success: false, error: 'Not a member of this room', code: 'FORBIDDEN' }
    }

    // Get basic round information
    const rounds = await prisma.round.findMany({
      where: { roomId },
      select: {
        id: true,
        question: true,
        sno: true,
        status: true,
        createdAt: true
      },
      orderBy: { sno: 'asc' }
    })

    return {
      success: true,
      data: rounds
    }

  } catch (error) {
    console.error('Error fetching rounds:', error)
    return { 
      success: false, 
      error: 'Internal server error', 
      code: 'INTERNAL_ERROR' 
    }
  }
}

/**
 * Create a new round
 */
export async function createRound(roomId: string, question: string, sno: number): Promise<ActionResult<{
  id: string
  roomId: string
  question: string
  sno: number
  status: string
  createdAt: Date
}>> {
  try {
    const round = await prisma.round.create({
      data: {
        roomId,
        question,
        sno,
        status: 'pending'
      }
    })

    return {
      success: true,
      data: round
    }

  } catch (error) {
    console.error('Error creating round:', error)
    return { 
      success: false, 
      error: 'Failed to create round', 
      code: 'INTERNAL_ERROR' 
    }
  }
}

/**
 * Update round status
 */
export async function updateRoundStatus(roundId: string, status: 'pending' | 'active' | 'voting' | 'finished'): Promise<ActionResult<{
  id: string
  roomId: string
  question: string
  sno: number
  status: string
  createdAt: Date
}>> {
  try {
    const round = await prisma.round.update({
      where: { id: roundId },
      data: { status }
    })

    return {
      success: true,
      data: round
    }

  } catch (error) {
    console.error('Error updating round status:', error)
    return { 
      success: false, 
      error: 'Failed to update round status', 
      code: 'INTERNAL_ERROR' 
    }
  }
}
