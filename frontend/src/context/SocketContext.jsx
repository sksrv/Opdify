'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('Opdify_token') : null;

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
      {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      }
    );

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Re-join rooms after reconnect
    socket.on('reconnect', () => {
      setConnected(true);
      // Rooms are re-joined by the components that own them
    });

    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
