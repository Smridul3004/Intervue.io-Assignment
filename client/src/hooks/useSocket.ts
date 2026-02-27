import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Custom hook that manages the Socket.io connection.
 * Requires an auth token — the socket won't connect without one.
 * Reconnects when the token changes (login/logout).
 */
const useSocket = (token: string | null) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Don't connect without a valid token
        if (!token) {
            setSocket(null);
            setIsConnected(false);
            return;
        }

        const newSocket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
            upgrade: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            auth: { token },
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            setIsConnected(false);
        });

        // Cleanup on unmount or token change
        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    return {
        socket,
        isConnected,
    };
};

export default useSocket;
