'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/providers/AuthProvider';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { session } = useAuth();

  const connect = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const s = await getSocket();
      setSocket(s);

      s.on('connect', () => setConnected(true));
      s.on('disconnect', () => setConnected(false));
    } catch {
      // Socket connection failed - non-critical
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token) {
      connect();
    }

    return () => {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
    };
  }, [session?.access_token, connect]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
