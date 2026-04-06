import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Returns a singleton Socket.io client instance.
 * Must only be called on the client (inside useEffect or event handlers).
 */
export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
    socket = io(socketUrl || undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}
