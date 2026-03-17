// Custom Next.js server with Socket.io mounted on the same HTTP port
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev })
const handle = app.getRequestHandler()

/**
 * In-memory registry of connected clients.
 * Key = socket.id, Value = { role, id, authority }
 * @type {Map<string, { role: 'citizen'|'officer', id: string, authority: string|null }>}
 */
const clients = new Map()

function broadcastPresence(io) {
  const all = Array.from(clients.values())
  io.to('grievance').emit('presence', {
    citizens: all
      .filter(c => c.role === 'citizen')
      .map(c => ({ id: c.id, authority: c.authority })),
    officers: all
      .filter(c => c.role === 'officer')
      .map(c => ({ id: c.id })),
    officersOnline: all.some(c => c.role === 'officer'),
  })
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true))
  })

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  })

  io.on('connection', (socket) => {
    // ── join ──────────────────────────────────────────────────────────────
    socket.on('join', ({ role, id }) => {
      clients.set(socket.id, { role, id, authority: null })
      socket.join('grievance')
      broadcastPresence(io)
    })

    // ── citizen switches authority dept ───────────────────────────────────
    socket.on('set_authority', ({ authority }) => {
      const c = clients.get(socket.id)
      if (c) {
        c.authority = authority
        broadcastPresence(io)
      }
    })

    // ── message relay ─────────────────────────────────────────────────────
    // Payload: { content, sender, citizenId, authority, timestamp }
    socket.on('send_message', (data) => {
      io.to('grievance').emit('new_message', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...data,
      })
    })

    // ── typing indicator ──────────────────────────────────────────────────
    socket.on('typing', (data) => {
      // Broadcast to everyone else in the room (not back to sender)
      socket.to('grievance').emit('typing', data)
    })

    // ── cleanup ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      clients.delete(socket.id)
      broadcastPresence(io)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
