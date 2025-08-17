import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket-server'
import { SOCKET_EVENTS } from '@/constants/api-routes'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ roomId: string; roundId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, roundId } = await context.params

    // Check if user is host of the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { hostId: true, status: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Only host can start rounds' }, { status: 403 })
    }

    if (room.status !== 'in_progress') {
      return NextResponse.json({ error: 'Game must be in progress to start rounds' }, { status: 400 })
    }

    // Get the round to start
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { id: true, status: true, question: true, sno: true, roomId: true }
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.roomId !== roomId) {
      return NextResponse.json({ error: 'Round does not belong to this room' }, { status: 400 })
    }

    if (round.status !== 'pending') {
      return NextResponse.json({ error: 'Round is not in pending status' }, { status: 400 })
    }

    // Update round status to "active"
    await prisma.round.update({
      where: { id: roundId },
      data: { status: 'active' }
    })

    // Emit "roundStarted" event via Socket.IO
    const io = getIO()
    if (io) {
      io.to(roomId).emit(SOCKET_EVENTS.ROUND_STARTED, {
        roomId,
        roundId: round.id,
        roundNumber: round.sno,
        question: round.question,
        timeLimit: 60 // 60 seconds
      })

      // Set timer for round end
      setTimeout(async () => {
        await endAnsweringPhase(roomId, round.id)
      }, 60000) // 60 seconds
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Round started successfully',
      round: {
        id: round.id,
        question: round.question,
        roundNumber: round.sno
      }
    })

  } catch (error) {
    console.error('Error starting round:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function endAnsweringPhase(roomId: string, roundId: string) {
  const io = getIO()
  if (!io) return

  try {
    // Get all answers for this round
    const answers = await prisma.answer.findMany({
      where: { roundId },
      select: { id: true, content: true, userId: true }
    })

    // Update round status to "voting"
    await prisma.round.update({
      where: { id: roundId },
      data: { status: 'voting' }
    })

    // Emit "roundVotingStarted" event with all answers
    io.to(roomId).emit(SOCKET_EVENTS.ROUND_VOTING_STARTED, {
      roomId,
      roundId,
      answers: answers.map(a => ({
        id: a.id,
        content: a.content,
        userId: a.userId
      })),
      timeLimit: 30 // 30 seconds for voting
    })

    // Set timer for voting phase end
    setTimeout(async () => {
      await endVotingPhase(roomId, roundId)
    }, 30000) // 30 seconds
  } catch (error) {
    console.error('Error ending answering phase:', error)
  }
}

async function endVotingPhase(roomId: string, roundId: string) {
  const io = getIO()
  if (!io) return

  try {
    // Import VoteManager to process votes
    const { voteManager } = await import('@/lib/vote-manager')
    
    // Get all votes from VoteManager for this room
    const roomVotes = voteManager.getAllVotesForRoom(roomId)
    
    // Convert votes to database format
    const votesToSave = roomVotes.flatMap(({ answerId, voterIds }) =>
      voterIds.map(voterId => ({
        roundId,
        voterId,
        answerId
      }))
    )

    // Save all votes to database using createMany
    if (votesToSave.length > 0) {
      await prisma.vote.createMany({
        data: votesToSave
      })
    }

    // Calculate scores for this round
    await calculateRoundScores(roomId, roundId, roomVotes)

    // Clear votes from VoteManager for this room
    voteManager.clearRoom(roomId)

    // Get final vote tallies for broadcasting
    const voteSummary = roomVotes.map(({ answerId, voterIds }) => ({
      answerId,
      voteCount: voterIds.length
    }))

    // Update round status to "finished"
    await prisma.round.update({
      where: { id: roundId },
      data: { 
        status: 'finished'
      }
    })

    // Emit "roundEnded" event with final tallies
    io.to(roomId).emit(SOCKET_EVENTS.ROUND_ENDED, {
      roomId,
      roundId,
      message: 'Round completed!',
      finalResults: voteSummary
    })

    // Check if all rounds are done
    const activeRounds = await prisma.round.count({
      where: { 
        roomId,
        status: { not: 'finished' }
      }
    })

    if (activeRounds === 0) {
      // All rounds completed, end game
      await endGame(roomId)
    }
  } catch (error) {
    console.error('Error ending voting phase:', error)
    // Still end the round even if there's an error
    await prisma.round.update({
      where: { id: roundId },
      data: { status: 'finished' }
    })
  }
}

async function calculateRoundScores(roomId: string, roundId: string, roomVotes: Array<{ answerId: string; voterIds: string[] }>) {
  try {
    // Get all answers for this round to calculate scores
    const answers = await prisma.answer.findMany({
      where: { roundId },
      select: { id: true, userId: true }
    })

    // Create a map of answerId to userId for quick lookup
    const answerToUser = new Map(answers.map(a => [a.id, a.userId]))

    // Calculate scores for each user based on votes received
    const userScores = new Map<string, number>()

    // Initialize all users with 0 points
    for (const answer of answers) {
      userScores.set(answer.userId, 0)
    }

    // Award points based on votes received
    for (const { answerId, voterIds } of roomVotes) {
      const answerUserId = answerToUser.get(answerId)
      if (answerUserId) {
        const currentScore = userScores.get(answerUserId) || 0
        userScores.set(answerUserId, currentScore + voterIds.length)
      }
    }

    // Save or update scores in the database
    for (const [userId, points] of userScores) {
      // Check if score already exists
      const existingScore = await prisma.score.findFirst({
        where: { userId, roomId }
      })

      if (existingScore) {
        // Update existing score
        await prisma.score.update({
          where: { id: existingScore.id },
          data: { points: existingScore.points + points }
        })
      } else {
        // Create new score
        await prisma.score.create({
          data: { userId, roomId, points }
        })
      }
    }

    // Emit scores updated event
    const io = getIO()
    if (io) {
      const finalScores = await prisma.score.findMany({
        where: { roomId },
        select: { userId: true, points: true }
      })

      io.to(roomId).emit(SOCKET_EVENTS.SCORES_UPDATED, {
        roomId,
        roundId,
        scores: finalScores
      })
    }
  } catch (error) {
    console.error('Error calculating round scores:', error)
    // Don't throw - scoring errors shouldn't break the game
  }
}

async function endGame(roomId: string) {
  const io = getIO()
  if (!io) return

  // Update room status to "done"
  await prisma.room.update({
    where: { id: roomId },
    data: { status: 'done' }
  })

  // Emit "gameOver" event
  io.to(roomId).emit(SOCKET_EVENTS.GAME_OVER, {
    roomId,
    message: 'Game completed! Check the scoreboard for final results.'
  })
}
