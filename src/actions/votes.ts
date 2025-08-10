import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { submitVoteSchema } from '@/lib/validations'

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export async function submitVote(userId: string, input: z.infer<typeof submitVoteSchema>): Promise<ActionResult> {
  try {
    const parsed = submitVoteSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid input data', code: 'VALIDATION_ERROR', data: parsed.error.errors }
    }

    const vote = await prisma.vote.create({
      data: {
        roundId: parsed.data.roundId,
        answerId: parsed.data.answerId,
        voterId: userId,
      },
      select: { id: true, roundId: true, answerId: true, voterId: true, createdAt: true },
    })

    // Increment score for the answer's author
    const answer = await prisma.answer.findUnique({ where: { id: parsed.data.answerId }, select: { userId: true, round: { select: { roomId: true } } } })
    if (answer?.userId && answer.round?.roomId) {
      // First try to update existing score, if not found create new one
      const existingScore = await prisma.score.findFirst({
        where: { userId: answer.userId, roomId: answer.round.roomId }
      })
      
      if (existingScore) {
        await prisma.score.update({
          where: { id: existingScore.id },
          data: { points: { increment: 1 } }
        })
      } else {
        await prisma.score.create({
          data: { userId: answer.userId, roomId: answer.round.roomId, points: 1 }
        })
      }
    }

    return { success: true, data: vote }
  } catch (error) {
    console.error('submitVote error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}
