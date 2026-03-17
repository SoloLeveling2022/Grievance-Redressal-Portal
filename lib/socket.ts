import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Returns a singleton Socket.io client instance.
 * Must only be called on the client (inside useEffect or event handlers).
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: '/socket.io' })
  }
  return socket
}
