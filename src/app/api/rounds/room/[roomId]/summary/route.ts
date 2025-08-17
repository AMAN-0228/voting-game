import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await context.params

    // Check if user is a member of the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { playerIds: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!room.playerIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
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
                email: true
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

    // Transform the data to include vote counts and winners
    const transformedRounds = rounds.map(round => {
      // Calculate vote counts for each answer
      const answerVoteCounts = round.answers.map(answer => ({
        id: answer.id,
        content: answer.content,
        userId: answer.userId,
        userName: answer.user.name || answer.user.email,
        voteCount: answer.votes.length,
        voters: answer.votes.map(vote => ({
          id: vote.voter.id,
          name: vote.voter.name || vote.voter.email
        }))
      }))

      // Find the winning answer (most votes)
      const winningAnswer = answerVoteCounts.reduce((winner, current) => 
        current.voteCount > winner.voteCount ? current : winner
      )

      // Get user's vote for this round
      const userVote = round.votes.find(vote => vote.voterId === session.user.id)

      return {
        id: round.id,
        sno: round.sno,
        question: round.question,
        status: round.status,
        createdAt: round.createdAt,
        answers: answerVoteCounts,
        winningAnswer: winningAnswer.voteCount > 0 ? winningAnswer : null,
        userVote: userVote ? {
          answerId: userVote.answerId,
          answerContent: userVote.answer.content,
          votedForUser: userVote.answer.user.name || userVote.answer.user.email
        } : null,
        totalVotes: round.votes.length
      }
    })

    return NextResponse.json({
      success: true,
      rounds: transformedRounds
    })

  } catch (error) {
    console.error('Error fetching round summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
