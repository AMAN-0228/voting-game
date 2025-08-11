import type { Server as IOServer, Socket } from 'socket.io'

export type SocketIOServer = IOServer
export type SocketType = Socket

export enum SocketEvents {
  // connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // room
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',

  // game lifecycle
  START_GAME = 'start_game',
  START_VOTING = 'start_voting',

  // actions
  ANSWER_SUBMIT = 'answer_submit',
  CAST_VOTE = 'cast_vote',

  // sync
  SYNC_STATE = 'sync_state',

  // broadcasts
  ROOM_UPDATED = 'room_updated',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  GAME_STARTED = 'game_started',
  ANSWERING_PHASE_STARTED = 'answering_phase_started',
  VOTING_PHASE_STARTED = 'voting_phase_started',
  ANSWER_RECEIVED = 'answer_received',
  SCORES_UPDATED = 'scores_updated',
  ERROR = 'error',
}

export interface JoinRoomPayload { roomId: string }
export interface LeaveRoomPayload { roomId: string }
export interface StartGamePayload { roomId: string }
export interface StartVotingPayload { roomId: string; roundId?: string }
export interface AnswerSubmitPayload { roundId: string; content: string }
export interface CastVotePayload { roundId: string; answerId: string }
export interface SyncStatePayload { roomId: string }

export interface UserInfo {
  id: string
  name?: string | null
  email?: string | null
}

export interface RoomData {
  id: string
  code: string
  status: string
  numRounds: number
  roundTime: number
  hostId: string
  playerIds: string[]
  createdAt: string
  scores?: Array<{ userId: string; points: number }>
}

export interface ServerToClientEvents {
  [SocketEvents.ROOM_UPDATED]: { room: RoomData; players?: string[]; isHost?: boolean }
  [SocketEvents.PLAYER_JOINED]: { roomId: string; user: UserInfo; playersOnline: string[] }
  [SocketEvents.PLAYER_LEFT]: { roomId: string; userId: string; user: UserInfo; playersOnline: string[] }
  [SocketEvents.GAME_STARTED]: { roomId: string; gamePhase: 'answering' | 'voting'; message?: string }
  [SocketEvents.ANSWERING_PHASE_STARTED]: { roomId: string; roundId: string; question: string }
  [SocketEvents.VOTING_PHASE_STARTED]: { roomId: string; roundId: string; answers: Array<{ id: string; content: string }> }
  [SocketEvents.ANSWER_RECEIVED]: { roundId: string; totalAnswers: number }
  [SocketEvents.SCORES_UPDATED]: { roomId: string; scores: Array<{ userId: string; points: number }> }
  [SocketEvents.ERROR]: { message: string; code?: string }
}

export interface ClientToServerEvents {
  [SocketEvents.JOIN_ROOM]: (payload: JoinRoomPayload) => void
  [SocketEvents.LEAVE_ROOM]: (payload: LeaveRoomPayload) => void
  [SocketEvents.START_GAME]: (payload: StartGamePayload) => void
  [SocketEvents.START_VOTING]: (payload: StartVotingPayload) => void
  [SocketEvents.ANSWER_SUBMIT]: (payload: AnswerSubmitPayload) => void
  [SocketEvents.CAST_VOTE]: (payload: CastVotePayload) => void
  [SocketEvents.SYNC_STATE]: (payload: SyncStatePayload) => void
}

export interface SocketAuthData {
  userId: string
  email?: string | null
  name?: string | null
}
