'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import SocketClient from '../lib/socket-client';

interface SocketContextType {
  socketClient: ReturnType<typeof SocketClient> | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  playerId: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socketClient: null,
  isConnected: false,
  isAuthenticated: false,
  userId: null,
  playerId: null
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
  token?: string;
  autoConnect?: boolean;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  token,
  autoConnect = true
}) => {
  const [socketClient] = useState(() => SocketClient({ autoConnect, token }));
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // 监听连接状态变化
    const handleConnectionChange = (data: { connected: boolean }) => {
      setIsConnected(data.connected);
    };

    // 监听认证状态变化
    const handleAuthenticated = (data: { userId: string }) => {
      setIsAuthenticated(true);
      setUserId(data.userId);
    };

    // 监听连接确认
    const handleConnected = (data: { playerId: string }) => {
      setPlayerId(data.playerId);
    };

    // 注册事件监听器
    socketClient.on('connectionChange', handleConnectionChange);
    socketClient.on('authenticated', handleAuthenticated);
    socketClient.on('connected', handleConnected);

    // 初始化连接
    if (autoConnect && !socketClient.isConnected()) {
      socketClient.connect(token);
    }

    // 清理函数
    return () => {
      socketClient.off('connectionChange', handleConnectionChange);
      socketClient.off('authenticated', handleAuthenticated);
      socketClient.off('connected', handleConnected);
    };
  }, [socketClient, token, autoConnect]);

  return (
    <SocketContext.Provider value={{
      socketClient,
      isConnected,
      isAuthenticated,
      userId,
      playerId
    }}>
      {children}
    </SocketContext.Provider>
  );
}; 