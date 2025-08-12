import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { z } from 'zod'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

const startRoundSchema = z.object({
  roomId: z.string().min(1),
  category: z.string().optional(),
})

export async function startRound(userId: string, input: z.infer<typeof startRoundSchema>): Promise<ActionResult> {
  try {
    const parsed = startRoundSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid input data', code: 'VALIDATION_ERROR', data: parsed.error.errors }
    }

    // Ensure user is part of room
    const room = await prisma.room.findUnique({ where: { id: parsed.data.roomId }, select: { id: true, hostId: true, playerIds: true } })
    if (!room) return { success: false, error: 'Room not found', code: 'NOT_FOUND' }
    const isMember = room.hostId === userId || room.playerIds.includes(userId)
    if (!isMember) return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }

    // Generate question via OpenAI (fallback to a static question if no key)
    let question = 'What is a fun fact about you?'
    try {
      if (process.env.OPENAI_API_KEY) {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const prompt = `Generate a short party question${parsed.data.category ? ` about ${parsed.data.category}` : ''}.`
        const resp = await client.responses.create({
          model: 'gpt-4o-mini',
          input: prompt,
        })
        const text = resp.output_text?.trim()
        if (text) question = text
      }
    } catch (e) {
      console.warn('OpenAI generation failed, using fallback question')
    }

    // Get the next sequence number for this room
    const lastRound = await prisma.round.findFirst({
      where: { roomId: parsed.data.roomId },
      orderBy: { sno: 'desc' },
      select: { sno: true }
    })
    const nextSno = (lastRound?.sno ?? 0) + 1

    const round = await prisma.round.create({
      data: { 
        roomId: parsed.data.roomId, 
        question,
        sno: nextSno
      },
      select: { id: true, roomId: true, question: true, createdAt: true },
    })

    return { success: true, data: round }
  } catch (error) {
    console.error('startRound error:', error)
    return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }
  }
}
