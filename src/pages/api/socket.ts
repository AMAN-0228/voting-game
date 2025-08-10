import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as HTTPServer } from 'http'
import { initSocketServer, isSocketServerInitialized } from '@/lib/socket-server'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // In Next.js dev, res.socket.server is the underlying HTTP server
  const server = (res.socket as any)?.server as HTTPServer | undefined
  if (!server) {
    res.status(500).end('Dev server not available')
    return
  }

  // If server already has IO attached or module singleton exists, return early
  if ((server as any).__io || isSocketServerInitialized()) {
    // Already initialized; respond quickly without noisy logs
    res.status(200).end('already-initialized')
    return
  }

  initSocketServer(server)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[socket] Socket.IO initialized in dev via /api/socket')
  }
  res.end('ok')
}
