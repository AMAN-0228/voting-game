import type { Server as HTTPServer } from 'http'
import { Server as IOServer } from 'socket.io'
import { getToken } from 'next-auth/jwt'
import { registerRoomHandlers } from '@/handlers/socket/roomHandlers'
import { registerGameHandlers } from '@/handlers/socket/gameHandlers'
import { registerLobbyHandlers } from '@/handlers/socket/lobbyHandlers'
import { roomsForSocket, removeOnline, getOnlineList, getUserInfo } from '@/lib/presence'
import { SOCKET_EVENTS } from '@/constants/api-routes'

let ioSingleton: IOServer | null = null

export function getIO(): IOServer | null {
  return ioSingleton
}

export function initSocketServer(httpServer: HTTPServer): IOServer {
  // If server already has IO attached, reuse it
  const existing = (httpServer as any).__io as IOServer | undefined
  if (existing) {
    ioSingleton = existing
    return existing
  }
  if (ioSingleton) return ioSingleton
  console.log('Socket server initialized');
  
  const isDev = process.env.NODE_ENV !== 'production'
  const corsOrigin = isDev
    ? 'http://localhost:3000'
    : process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const io = new IOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // NextAuth JWT handshake auth
  io.use(async (socket, next) => {
    try {
      const cookie = socket.request.headers.cookie || ''
      const secret = process.env.NEXTAUTH_SECRET
      if (!secret) return next(new Error('Missing NEXTAUTH_SECRET'))

      // decode NextAuth session token from cookies (robust for WS handshake)
      const rawPairs = cookie
        .split(';')
        .map((c) => c.trim())
        .filter(Boolean)
      const cookies: Record<string, string> = Object.fromEntries(
        rawPairs.map((c) => {
          const idx = c.indexOf('=')
          return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))]
        })
      )
      const baseName = process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token'
      // handle chunked cookies: `${baseName}.0`, `.1`, ... else fallback to base
      const chunkKeys = Object.keys(cookies)
        .filter((k) => k === baseName || k.startsWith(`${baseName}.`))
        .sort((a, b) => {
          const ai = a === baseName ? -1 : parseInt(a.split('.').pop() || '0', 10)
          const bi = b === baseName ? -1 : parseInt(b.split('.').pop() || '0', 10)
          return ai - bi
        })
      let sessionToken = ''
      if (chunkKeys.length > 0) {
        sessionToken = chunkKeys.map((k) => cookies[k]).join('')
      }
      let token = sessionToken
        ? await (await import('next-auth/jwt')).decode({ token: sessionToken, secret })
        : null
      // Fallback to getToken which understands NextAuth internals
      if (!token) {
        const { getToken } = await import('next-auth/jwt')
        token = await getToken({ req: { headers: { cookie } } as any, secret, secureCookie: process.env.NODE_ENV === 'production' })
      }
      const userIdFromToken = (token as any)?.id || (token as any)?.sub
      if (!userIdFromToken) return next(new Error('Unauthorized'))

      // attach basic user info for handlers
      ;(socket as any).data = {
        ...(socket as any).data,
        userId: userIdFromToken,
        email: (token as any)?.email ?? null,
        name: (token as any)?.name ?? null,
      }
      // console.log('__________ Socket Data:', (socket as any).data);
      return next()
    } catch (e) {
      return next(new Error('Auth error'))
    }
  })
  
  io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[socket] connect ${socket.id} user=${(socket as any).data?.userId}`)
    }
    // Register modular handlers
    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerLobbyHandlers(io, socket)

    socket.on('disconnect', (reason: string) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[socket] disconnect ${socket.id} reason=${reason}`)
      }
      const userId = (socket as any).data?.userId as string | undefined
      if (!userId) return
      
      const rooms = roomsForSocket(socket.id)
      for (const roomId of rooms) {
        removeOnline(roomId, userId)
        
        // Get user info before removing
        const userInfo = getUserInfo(userId)
        
        // Broadcast player_offline event with updated online list
        io.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
          roomId,
          userId,
          user: userInfo,
          playersOnline: getOnlineList(roomId)
        })
      }
    })
  })

  // Mark both module singleton and server reference
  ;(httpServer as any).__io = io
  ioSingleton = io
  if (isDev) {
    console.log('Socket.IO initialized in dev')
  } else {
    console.log('Socket.IO initialized in prod')
  }
  return io
}

// Helper to check if Socket.IO has already been initialized on this process
export function isSocketServerInitialized(): boolean {
  return !!ioSingleton
}

