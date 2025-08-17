import { apiRequest } from './api-client'
import { API_ROUTES } from '@/constants/api-routes'
import { AxiosResponse } from 'axios'

// Generic response type for API calls
export interface ApiResponse<T = unknown> {
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
export function handleApiError(error: unknown): never {
  if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
    throw new Error(String(error.response.data.error))
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    throw new Error(error.message)
  }
  throw new Error('An unexpected error occurred')
}

// Core HTTP client - industrial standard approach
export const httpClient = {
  async get<T = unknown>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.get(url)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.post(url, data)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.put(url, data)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await apiRequest.patch(url, data)
      return { data: response.data }
    } catch (error) {
      handleApiError(error)
    }
  },

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
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
    httpClient.post<{ user: User; token: string }>(API_ROUTES.LOGIN, credentials),

  register: (userData: { email: string; password: string; name?: string }) =>
    httpClient.post<{ user: User; token: string }>(API_ROUTES.REGISTER, userData),
}

// Legacy alias for backward compatibility
export const authHelpers = authService

// Room service - room management
export const roomService = {
  create: (roomData: { numRounds: number; roundTime: number }) =>
    httpClient.post(API_ROUTES.ROOMS, roomData),
  
  list: () =>
    httpClient.get(API_ROUTES.ROOMS),
  
  listUserRooms: () =>
    httpClient.get(API_ROUTES.ROOMS),
  
  getById: (id: string) =>
    httpClient.get(API_ROUTES.ROOM_BY_ID(id)),
  
  getSummary: (roomId: string) =>
    httpClient.get(API_ROUTES.ROUNDS_MANAGEMENT.GET_SUMMARY(roomId)),
  
  join: (roomId: string) =>
    httpClient.post(API_ROUTES.JOIN_BY_ID(roomId)),
  
  joinByCode: (code: string) =>
    httpClient.post(API_ROUTES.JOIN_BY_CODE(code)),
}

// Legacy alias for backward compatibility
export const roomHelpers = {
  createRoom: roomService.create,
  listRooms: roomService.list,
  listUserRooms: roomService.listUserRooms,
  getRoomById: roomService.getById,
  getSummary: roomService.getSummary,
  joinRoomById: roomService.join,
  joinRoomByCode: roomService.joinByCode,
}

// Round service - round management
export const roundService = {
  create: (roundData: { roomId: string; question: string; sno: number }) =>
    httpClient.post(API_ROUTES.ROUNDS_MANAGEMENT.CREATE, roundData),
  
  getByRoom: (roomId: string) =>
    httpClient.get(API_ROUTES.ROUNDS_MANAGEMENT.GET_BY_ROOM(roomId)),
  
  getById: (id: string) =>
    httpClient.get(API_ROUTES.ROUNDS_MANAGEMENT.GET_BY_ID(id)),
  
  end: (id: string) =>
    httpClient.post(API_ROUTES.ROUNDS_MANAGEMENT.END(id)),
}

// Answer service - answer management
export const answerService = {
  submit: (answerData: { roundId: string; content: string }) =>
    httpClient.post(API_ROUTES.ANSWERS_MANAGEMENT.SUBMIT, answerData),
}

// Legacy alias for backward compatibility
export const answerHelpers = {
  submitAnswer: answerService.submit,
}

// Vote service - voting management
export const voteService = {
  submit: (voteData: { roundId: string; answerId: string }) =>
    httpClient.post(API_ROUTES.VOTES_MANAGEMENT.SUBMIT, voteData),
}

// Legacy alias for backward compatibility
export const voteHelpers = {
  submitVote: voteService.submit,
}

// AI service - AI-powered features
export const aiService = {
  generateQuestion: (category?: string) =>
    httpClient.post('/api/ai/generate-question', { category }),
}

// User service - user management
export const userService = {
  getProfile: () => httpClient.get('/api/users/profile'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    httpClient.put('/api/users/profile', data),
  
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
