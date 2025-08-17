// API Routes Constants
// All endpoint paths for the Vibe application

export const API_ROUTES = {
  // Auth routes
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  
  // Room routes
  ROOMS: '/api/rooms',
  ROOM_BY_ID: (id: string) => `/api/rooms/${id}`,
  JOIN_ROOM: '/api/rooms/join',
  JOIN_BY_ID: (id: string) => `/api/rooms/${id}/join`,
  JOIN_BY_CODE: (code: string) => `/api/rooms/join/${code}`,
  SEND_INVITE: (roomId: string) => `/api/rooms/${roomId}/invite`,
  GET_SUMMARY: (roomId: string) => `/api/rooms/${roomId}/summary`,
  
  // Socket.IO
  SOCKET_INIT: '/api/socket',

  // Game/Round management routes
  ROUNDS_MANAGEMENT: {
    CREATE: '/api/rounds',
    GET_BY_ROOM: (roomId: string) => `/api/rounds/room/${roomId}`,
    GET_SUMMARY: (roomId: string) => `/api/rounds/room/${roomId}/summary`,
    GET_BY_ID: (id: string) => `/api/rounds/${id}`,
    START: (id: string) => `/api/rounds/${id}/start`,
    END: (id: string) => `/api/rounds/${id}/end`,
    START_BY_ROOM: (roomId: string, roundId: string) => `/api/rooms/${roomId}/rounds/${roundId}/start`,
  },

  // Game management routes
  GAME_MANAGEMENT: {
    START: (roomId: string) => `/api/rooms/${roomId}/game/start`,
    END: (roomId: string) => `/api/rooms/${roomId}/game/end`,
    PAUSE: (roomId: string) => `/api/rooms/${roomId}/game/pause`,
    RESUME: (roomId: string) => `/api/rooms/${roomId}/game/resume`,
    STATUS: (roomId: string) => `/api/rooms/${roomId}/game/status`,
  },

  // Answer management routes
  ANSWERS_MANAGEMENT: {
    SUBMIT: '/api/answers',
    GET_BY_ROUND: (roundId: string) => `/api/answers/round/${roundId}`,
    GET_BY_USER: (userId: string) => `/api/answers/user/${userId}`,
    UPDATE: (id: string) => `/api/answers/${id}`,
    DELETE: (id: string) => `/api/answers/${id}`,
  },

  // Voting routes
  VOTES_MANAGEMENT: {
    SUBMIT: '/api/votes',
    GET_BY_ROUND: (roundId: string) => `/api/votes/round/${roundId}`,
    GET_BY_USER: (userId: string) => `/api/votes/user/${userId}`,
    DELETE: (id: string) => `/api/votes/${id}`,
  },

  // Score management routes
  SCORES: {
    GET_BY_ROOM: (roomId: string) => `/api/scores/room/${roomId}`,
    GET_BY_USER: (userId: string) => `/api/scores/user/${userId}`,
    UPDATE: '/api/scores/update',
    LEADERBOARD: (roomId: string) => `/api/scores/leaderboard/${roomId}`,
  },

  // AI/Question generation routes
  AI: {
    GENERATE_QUESTION: '/api/ai/generate-question',
    VALIDATE_ANSWER: '/api/ai/validate-answer',
  },

  // WebSocket routes
  WEBSOCKET: {
    CONNECT: '/api/socket',
    ROOM_EVENTS: (roomId: string) => `/socket/room/${roomId}`,
  },

  // User management routes
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    GET_BY_ID: (id: string) => `/api/users/${id}`,
  },
} as const

// WebSocket event types
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',
  
  // Room events
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE: 'room:update',
  ROOM_DATA: 'roomData',
  ROOM_SYNC: 'room:sync',
  ROOM_ERROR: 'room:error',
  ROOM_STATUS_UPDATE: 'room:status:update',
  
  // Game events
  GAME_START: 'game:start',
  GAME_STARTED: 'game:started',
  GAME_STATE_UPDATE: 'game:state:update',
  GAME_STATE_REQUEST: 'game:state:request',
  GAME_STATE_RESPONSE: 'game:state:response',
  GAME_STATE_SYNCING: 'game:state:syncing',
  GAME_STATE_SYNC: 'game:state:sync',
  GAME_JOIN: 'game:join',
  GAME_LEAVE: 'game:leave',
  GAME_ROUND_START: 'game:round:start',
  GAME_ROUND_END: 'game:round:end',
  GAME_VOTING_START: 'game:voting:start',
  GAME_ANSWER_SUBMIT: 'game:answer:submit',
  GAME_ANSWER_SUBMITTED: 'game:answer:submitted',
  GAME_ANSWERS_UPDATE: 'game:answers:update',
  GAME_VOTE_SUBMIT: 'game:vote:submit',
  GAME_VOTE_SUBMITTED: 'game:vote:submitted',
  GAME_VOTES_UPDATE: 'game:votes:update',
  GAME_PHASE_UPDATE: 'game:phase:update',
  GAME_ERROR: 'game:error',
  GAME_ENDED: 'game:ended',
  
  // Legacy game events (for backward compatibility)
  GAME_STARTED_LEGACY: 'game_started',
  ROUND_STARTED_LEGACY: 'round_started',
  ROUND_VOTING_STARTED_LEGACY: 'round_voting_started',
  VOTE_UPDATE_LEGACY: 'vote_update',
  ROUND_ENDED_LEGACY: 'round_ended',
  GAME_OVER_LEGACY: 'game_over',
  SCORES_UPDATED_LEGACY: 'scores_updated',
  SYNC_GAME_STATE_LEGACY: 'sync_game_state',
  
  // Timer events
  TIMER_TICK: 'timer:tick',
  TIMER_END: 'timer:end',
} as const

// HTTP Status codes for consistent error handling
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const