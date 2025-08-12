import { createServer } from 'http'
import next from 'next'
import { initSocketServer } from './src/lib/socket-server'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

async function main() {
  const app = next({ dev })
  const handle = app.getRequestHandler()

  await app.prepare()

  const server = createServer((req, res) => handle(req, res))

  // Initialize Socket.IO server for both dev and prod
  initSocketServer(server)

  server.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`)
    console.log(`🔌 Socket.IO server initialized at ws://localhost:${port}/socket.io`)
    console.log(`🌍 Environment: ${dev ? 'development' : 'production'}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})