import { z } from 'zod'

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Room schemas
export const createRoomSchema = z.object({
  numRounds: z.number().min(1, 'Must have at least 1 round').max(20, 'Maximum 20 rounds'),
  roundTime: z.number().min(30, 'Minimum 30 seconds per round').max(300, 'Maximum 5 minutes per round'),
})

export const joinRoomSchema = z.object({
  code: z.string().min(1, 'Room code is required'),
})

export const updateRoomStatusSchema = z.object({
  status: z.enum(['starting', 'in_progress', 'done'], {
    errorMap: () => ({ message: 'Status must be starting, in_progress, or done' })
  }),
})

// Round schemas
export const createRoundSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  question: z.string().min(1, 'Question is required'),
})

// Answer schemas
export const submitAnswerSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
  content: z.string().min(1, 'Answer content is required').max(500, 'Answer too long'),
})

// Vote schemas
export const submitVoteSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
  answerId: z.string().min(1, 'Answer ID is required'),
})

// AI schemas
export const generateQuestionSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
})

// WebSocket schemas
export const joinRoomEventSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  userId: z.string().min(1, 'User ID is required'),
})

export const leaveRoomEventSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  userId: z.string().min(1, 'User ID is required'),
})

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type JoinRoomInput = z.infer<typeof joinRoomSchema>
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>
export type CreateRoundInput = z.infer<typeof createRoundSchema>
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>
export type GenerateQuestionInput = z.infer<typeof generateQuestionSchema>
export type JoinRoomEventInput = z.infer<typeof joinRoomEventSchema>
export type LeaveRoomEventInput = z.infer<typeof leaveRoomEventSchema>
