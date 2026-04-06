// Custom Next.js server with Socket.io mounted on the same HTTP port
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev })
const handle = app.getRequestHandler()

const appBaseUrl = (process.env.APP_BASE_URL || `http://localhost:${port}`).replace(/\/+$/, '')
const socketCorsOrigin = process.env.SOCKET_CORS_ORIGIN || '*'

/**
 * In-memory registry of connected clients.
 * Key = socket.id, Value = { role, id, authority }
 * @type {Map<string, { role: 'citizen'|'officer', id: string, authority: string|null }>}
 */
const clients = new Map()
const sharedRecordsByOfficer = new Map()

function findSocketIdsByClient(role, id) {
  const socketIds = []
  for (const [socketId, client] of clients.entries()) {
    if (client.role === role && client.id === id) {
      socketIds.push(socketId)
    }
  }
  return socketIds
}

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
    cors: { origin: socketCorsOrigin === '*' ? '*' : socketCorsOrigin.split(',').map((origin) => origin.trim()) },
  })

  io.on('connection', (socket) => {
    // ── join ──────────────────────────────────────────────────────────────
    socket.on('join', ({ role, id }) => {
      clients.set(socket.id, { role, id, authority: null })
      socket.join('grievance')
      console.log(`[Socket] join role=${role} id=${id} socket=${socket.id}`)
      broadcastPresence(io)
    })

    // ── citizen switches authority dept ───────────────────────────────────
    socket.on('set_authority', ({ authority }) => {
      const c = clients.get(socket.id)
      if (c) {
        c.authority = authority
        console.log(`[Socket] set_authority citizen=${c.id} authority=${authority}`)
        broadcastPresence(io)
      }
    })

    // ── message relay ─────────────────────────────────────────────────────
    // Payload: { content, sender, citizenId, authority, timestamp }
    socket.on('send_message', (data) => {
      console.log(`[Socket] send_message sender=${data.sender} citizenId=${data.citizenId} authority=${data.authority}`)
      io.to('grievance').emit('new_message', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...data,
      })
    })

    // Officer asks a specific citizen to open/share records link.
    socket.on('request_records_link', ({ officerId, citizenId, authority, link, requestedAt }) => {
      console.log(`[RecordsFlow] request officer=${officerId} citizen=${citizenId} link=${link}`)
      const citizenSocketIds = findSocketIdsByClient('citizen', citizenId)
      if (citizenSocketIds.length === 0) {
        console.log(`[RecordsFlow] citizen_not_found citizen=${citizenId}`)
        socket.emit('records_link_request_status', {
          ok: false,
          citizenId,
          reason: `Citizen ${citizenId} is offline or unavailable`,
        })
        return
      }

      citizenSocketIds.forEach((citizenSocketId) => {
        io.to(citizenSocketId).emit('records_link_request', {
          officerId,
          citizenId,
          authority,
          link,
          requestedAt,
        })
      })

      io.to('grievance').emit('new_message', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        content: `Officer ${officerId} requested records access. Click the green approval banner to continue.`,
        sender: 'authority',
        citizenId,
        authority: authority || 'health',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
      })

      socket.emit('records_link_request_status', {
        ok: true,
        citizenId,
      })
      console.log(`[RecordsFlow] request_delivered citizenSockets=${citizenSocketIds.length}`)
    })

    // Citizen approved and clicked the requested link; notify that officer only.
    socket.on('approve_records_link', ({ officerId, citizenId, link, approvedAt }) => {
      console.log(`[RecordsFlow] approved citizen=${citizenId} officer=${officerId} link=${link}`)
      const officerSocketIds = findSocketIdsByClient('officer', officerId)
      if (officerSocketIds.length === 0) {
        console.log(`[RecordsFlow] officer_not_found officer=${officerId}`)
        return
      }

      officerSocketIds.forEach((officerSocketId) => {
        io.to(officerSocketId).emit('records_link_ready', {
          officerId,
          citizenId,
          link,
          approvedAt,
        })
      })
      console.log(`[RecordsFlow] approval_delivered officerSockets=${officerSocketIds.length}`)
    })

    // Citizen shares selected record files with a specific officer.
    socket.on('share_selected_records', ({ officerId, citizenId, sharedAt, records }) => {
      const safeRecords = Array.isArray(records) ? records : []
      const totalLinks = safeRecords.reduce((acc, rec) => acc + (Array.isArray(rec.links) ? rec.links.length : 0), 0)
      console.log(`[RecordsFlow] selected_share citizen=${citizenId} officer=${officerId} records=${safeRecords.length} links=${totalLinks}`)
      const officerSocketIds = findSocketIdsByClient('officer', officerId)
      const accessLink = `${appBaseUrl}/officers/accessedRecords?shareToOfficer=${encodeURIComponent(officerId)}`

      const existing = sharedRecordsByOfficer.get(officerId) || []
      const payloadWithMeta = safeRecords.map((record) => ({
        ...record,
        citizenId,
        sharedAt,
      }))
      sharedRecordsByOfficer.set(officerId, [...existing, ...payloadWithMeta])
      console.log(`[RecordsFlow] stored_for_officer officer=${officerId} total=${sharedRecordsByOfficer.get(officerId).length}`)

      if (officerSocketIds.length === 0) {
        console.log(`[RecordsFlow] share_failed officer_not_found officer=${officerId}`)
        return
      }

      officerSocketIds.forEach((officerSocketId) => {
        io.to(officerSocketId).emit('citizen_records_shared', {
          officerId,
          citizenId,
          sharedAt,
          accessLink,
          records: safeRecords,
        })
      })

      console.log(`[RecordsFlow] share_delivered officerSockets=${officerSocketIds.length}`)
    })

    socket.on('get_officer_shared_records', ({ officerId }) => {
      const list = sharedRecordsByOfficer.get(officerId) || []
      console.log(`[RecordsFlow] officer_fetch officer=${officerId} count=${list.length}`)
      socket.emit('officer_shared_records', {
        officerId,
        records: list,
      })
    })

    // ── typing indicator ──────────────────────────────────────────────────
    socket.on('typing', (data) => {
      // Broadcast to everyone else in the room (not back to sender)
      socket.to('grievance').emit('typing', data)
    })

    // ── cleanup ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const disconnectedClient = clients.get(socket.id)
      if (disconnectedClient) {
        console.log(`[Socket] disconnect role=${disconnectedClient.role} id=${disconnectedClient.id} socket=${socket.id}`)
      }
      clients.delete(socket.id)
      broadcastPresence(io)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on ${appBaseUrl}`)
  })
})
