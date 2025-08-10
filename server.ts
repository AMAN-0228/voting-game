import { createServer } from 'http'
import next from 'next'
import { initSocketServer } from './src/lib/socket-server'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

async function main() {
  const app = next({ dev })
  const handle = app.getRequestHandler()

  if (dev) {
    // In development, we rely on `next dev` which starts its own server.
    // Socket.IO gets initialized via the dev-only route `src/pages/api/socket.ts`.
    console.log('[server] Dev mode detected. Run `next dev` (handled by package.json scripts).')
    console.log('[server] Socket.IO will be initialized when /api/socket is requested.')
    // Optionally, we can prepare to validate config, but we do not start a server here.
    return
  }

  await app.prepare()

  const server = createServer((req, res) => handle(req, res))

  // Attach Socket.IO to the same HTTP server (singleton inside initSocketServer)
  initSocketServer(server)

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
