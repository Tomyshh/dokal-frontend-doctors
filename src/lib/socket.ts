import { io, Socket } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';

function getSocketBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const serverUrl = typeof window === 'undefined' ? process.env.BACKEND_URL : undefined;
  const url = publicUrl || serverUrl || 'http://localhost:3000';

  if (typeof window !== 'undefined' && !publicUrl) {
    // eslint-disable-next-line no-console
    console.warn(
      'NEXT_PUBLIC_SOCKET_URL non défini. Le realtime utilisera une valeur par défaut. ' +
        'Recommandé: définir NEXT_PUBLIC_SOCKET_URL (ex: https://dokal-backend.onrender.com).'
    );
  }

  return url.replace(/\/+$/, '');
}

const SOCKET_URL = getSocketBaseUrl();

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No session available for socket connection');
  }

  socket = io(SOCKET_URL, {
    auth: { token: session.access_token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
