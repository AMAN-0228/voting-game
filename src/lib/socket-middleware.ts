import type { Socket } from 'socket.io'

/**
 * Middleware to ensure user is authenticated
 */
export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  const userId = socket.handshake.auth.userId
  const username = socket.handshake.auth.username

  if (!userId || !username) {
    return next(new Error('Authentication required'))
  }

  socket.data.userId = userId
  socket.data.username = username
  next()
}

/**
 * Middleware to log socket events
 */
export function loggerMiddleware(socket: Socket, next: (err?: Error) => void) {
  // Log connection
  console.log(`Socket connecting: ${socket.id}`)
  
  // Add timestamp to socket data
  socket.data.connectedAt = new Date()
  
  // Log all events
  const originalEmit = socket.emit
  socket.emit = function(ev: string, ...args: any[]) {
    console.log(`[${socket.id}] Emit: ${ev}`, args)
    return originalEmit.apply(this, [ev, ...args])
  }
  
  next()
}

/**
 * Error handler for socket events
 */
export function errorHandler(socket: Socket, error: Error) {
  console.error(`[${socket.id}] Error:`, error)
  socket.emit('game:error', { message: error.message })
}