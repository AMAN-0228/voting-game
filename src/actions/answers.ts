import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { submitAnswerSchema } from '@/lib/validations'

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export async function submitAnswer(userId: string, input: z.infer<typeof submitAnswerSchema>): Promise<ActionResult> {
  try {
    const parsed = submitAnswerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid input data', code: 'VALIDATION_ERROR', data: parsed.error.errors }
    }

    // Create answer (not anonymous in DB, anonymity is handled on the client/broadcasting)
    const ans = await prisma.answer.create({
      data: {
        roundId: parsed.data.roundId,
        content: parsed.data.content,
        userId,
      },
      select: { id: true, roundId: true, content: true, userId: true, createdAt: true },
    })

    return { success: true, data: ans }
  } catch (error) {
    console.error('submitAnswer error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}
