import { io, Socket } from 'socket.io-client';

// In development Vite proxies /socket.io → localhost:5000.
// In production VITE_API_URL must point to the deployed backend.
const BACKEND_URL = import.meta.env.VITE_API_URL ?? '';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(BACKEND_URL || '/', {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
