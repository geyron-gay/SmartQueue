// hooks/useQueueSocket.ts
import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket } from '../context/socket';

export const useQueueSocket = (
  user: any, 
  onQueueUpdate: (payload: any) => void,
  dependencies: any[] = []
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    let socket: Socket | null = null;
    
    const setup = async () => {
      socket = await initializeSocket();
      socketRef.current = socket;
      
      socket.on('QueueUpdated', (payload) => {
        onQueueUpdate(payload);
      });
    };

    setup();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [user, ...dependencies]);

  return socketRef;
};