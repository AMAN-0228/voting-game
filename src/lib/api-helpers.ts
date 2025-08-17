import { apiRequest } from './api-client'
import { API_ROUTES } from '@/constants/api-routes'
import { AxiosResponse } from 'axios'

// Generic response type for API calls
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  code?: string
}

// Types for API responses
export interface Room {
  id: string
  code: string
  status: 'starting' | 'in_progress' | 'done'
  numRounds: number
  roundTime: number
  hostId: string
  playerIds: string[]
  players?: Player[]
  createdAt: string
  host: {
    id: string
    name?: string
    email: string
  }
}

// API response wrapper for room endpoints
export interface RoomApiResponse {
  room: Room
}

export interface Player {
  id: string
  name: string | null
  email: string
  isOnline?: boolean
  joinedAt?: string
}

export interface User {
  id: string
  email: string
  name: string | null
}

// Generic API error handler
export function handleApiError(error: any): never {
  if (error.response?.data?.error) {
    throw new Error(error.response.data.error)
  }
  if (error.message) {
    throw new Error(error.message)
  }
  throw new Error('An unexpected error occurred')
}

// Core HTTP client - industrial standard approach
export const httpClient = {
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.get(url)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.post(url, data)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.put(url, data)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.patch(url, data)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.delete(url)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  }
}

// Authentication service - feature-based organization
export const authService = {
  login: (credentials: { email: string; password: string }) =>
    httpClient.post<any>(API_ROUTES.LOGIN, credentials),

  register: (userData: { email: string; password: string; name?: string }) =>
    httpClient.post<any>(API_ROUTES.REGISTER, userData),
}

// Legacy alias for backward compatibility
export const authHelpers = authService

// Room service - comprehensive room management
export const roomService = {
  list: () => httpClient.get<Room[]>(API_ROUTES.ROOMS),
  
  listUserRooms: () => httpClient.get<Room[]>(API_ROUTES.ROOMS),
  
  create: (data: { numRounds: number; roundTime: number }) =>
    httpClient.post<Room>(API_ROUTES.ROOMS, data),
  
  getById: (roomId: string) =>
    httpClient.get<RoomApiResponse>(API_ROUTES.ROOM_BY_ID(roomId)),
  
  join: (roomId: string) =>
    httpClient.post<Room>(API_ROUTES.JOIN_BY_ID(roomId)),
  
  joinByCode: (code: string) =>
    httpClient.post<Room>(API_ROUTES.JOIN_BY_CODE(code)),
  
  sendInvite: (roomId: string, userIds: string[]) =>
    httpClient.post<{ invites: any[]; message: string }>(
      API_ROUTES.SEND_INVITE(roomId), 
      { userIds }
    ),
  getSummary: (roomId: string) =>
    httpClient.get(API_ROUTES.ROUNDS_MANAGEMENT.GET_SUMMARY(roomId)),
}

// Legacy alias for backward compatibility
export const roomHelpers = {
  listRooms: roomService.list,
  listUserRooms: roomService.listUserRooms,
  createRoom: roomService.create,
  getRoomById: roomService.getById,
  joinRoomById: roomService.join,
  joinRoomByCode: roomService.joinByCode,
  sendInvite: roomService.sendInvite,
  getSummary: roomService.getSummary,
}

// Round service - game round management
export const roundService = {
  create: (roundData: { roomId: string; question: string }) =>
    httpClient.post(API_ROUTES.ROUNDS_MANAGEMENT.CREATE, roundData),
  
  getByRoom: (roomId: string) =>
    httpClient.get(API_ROUTES.ROUNDS_MANAGEMENT.GET_BY_ROOM(roomId)),
  
  getById: (id: string) =>
    httpClient.get(API_ROUTES.ROUNDS_MANAGEMENT.GET_BY_ID(id)),
  
  start: (id: string) =>
    httpClient.post(API_ROUTES.ROUNDS_MANAGEMENT.START(id)),
  
  end: (id: string) =>
    httpClient.post(API_ROUTES.ROUNDS_MANAGEMENT.END(id)),
}


// Answer service - answer management
export const answerService = {
  submit: (answerData: { roundId: string; content: string }) =>
    httpClient.post(API_ROUTES.ANSWERS_MANAGEMENT.SUBMIT, answerData),
  
  getByRound: (roundId: string) =>
    httpClient.get(API_ROUTES.ANSWERS_MANAGEMENT.GET_BY_ROUND(roundId)),
  
  getByUser: (userId: string) =>
    httpClient.get(API_ROUTES.ANSWERS_MANAGEMENT.GET_BY_USER(userId)),
  
  update: (id: string, data: any) =>
    httpClient.put(API_ROUTES.ANSWERS_MANAGEMENT.UPDATE(id), data),
  
  delete: (id: string) =>
    httpClient.delete(API_ROUTES.ANSWERS_MANAGEMENT.DELETE(id)),
}

// Legacy alias for backward compatibility
export const answerHelpers = {
  submitAnswer: answerService.submit,
  getAnswersByRound: answerService.getByRound,
  getAnswersByUser: answerService.getByUser,
  updateAnswer: answerService.update,
  deleteAnswer: answerService.delete,
}

// Vote service - voting management
export const voteService = {
  submit: (voteData: { roundId: string; answerId: string }) =>
    httpClient.post(API_ROUTES.VOTES_MANAGEMENT.SUBMIT, voteData),
  
  getByRound: (roundId: string) =>
    httpClient.get(API_ROUTES.VOTES_MANAGEMENT.GET_BY_ROUND(roundId)),
  
  getByUser: (userId: string) =>
    httpClient.get(API_ROUTES.VOTES_MANAGEMENT.GET_BY_USER(userId)),
  
  delete: (id: string) =>
    httpClient.delete(API_ROUTES.VOTES_MANAGEMENT.DELETE(id)),
}

// Legacy alias for backward compatibility
export const voteHelpers = {
  submitVote: voteService.submit,
  getVotesByRound: voteService.getByRound,
  getVotesByUser: voteService.getByUser,
  deleteVote: voteService.delete,
}

// Score service - scoring and leaderboard management
export const scoreService = {
  getByRoom: (roomId: string) =>
    httpClient.get(API_ROUTES.SCORES.GET_BY_ROOM(roomId)),
  
  getByUser: (userId: string) =>
    httpClient.get(API_ROUTES.SCORES.GET_BY_USER(userId)),
  
  update: (data: any) =>
    httpClient.post(API_ROUTES.SCORES.UPDATE, data),
  
  getLeaderboard: (roomId: string) =>
    httpClient.get(API_ROUTES.SCORES.LEADERBOARD(roomId)),
}

// Legacy alias for backward compatibility
export const scoreHelpers = {
  getScoresByRoom: scoreService.getByRoom,
  getScoresByUser: scoreService.getByUser,
  updateScores: scoreService.update,
  getLeaderboard: scoreService.getLeaderboard,
}

// AI service - AI-powered features
export const aiService = {
  generateQuestion: (category?: string) =>
    httpClient.post(API_ROUTES.AI?.GENERATE_QUESTION || '/api/ai/generate-question', { category }),
}

// User service - user management
export const userService = {
  getProfile: () => httpClient.get(API_ROUTES.USERS?.PROFILE || '/api/users/profile'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    httpClient.put(API_ROUTES.USERS.UPDATE_PROFILE, data),
  
  search: (query: string) =>
    httpClient.get(`/api/users/search?q=${encodeURIComponent(query)}`),
}

// Legacy aliases for backward compatibility
export const aiHelpers = {
  generateQuestion: aiService.generateQuestion,
}

export const userHelpers = {
  getProfile: userService.getProfile,
  updateProfile: userService.updateProfile,
  searchUsers: userService.search,
}
