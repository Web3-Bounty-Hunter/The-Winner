'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socketClient: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  playerId: string | null;
}

export const SocketContext = createContext<SocketContextType>({
  socketClient: null,
  isConnected: false,
  isAuthenticated: false,
  userId: null,
  playerId: null
});

export const useSocket = () => useContext(SocketContext);

// 添加全局函数用于强制更新连接状态
let lastForcedTime = 0;
export const forceSocketConnected = () => {
  // 限制调用频率，最多5秒一次
  const now = Date.now();
  if (now - lastForcedTime < 5000) {
    console.log('忽略过于频繁的强制连接请求');
    return false;
  }
  lastForcedTime = now;
  
  const socketProvider = document.querySelector('#socket-provider');
  if (socketProvider && socketProvider.__reactFiber$) {
    const stateNode = socketProvider.__reactFiber$._debugOwner.stateNode;
    if (stateNode && typeof stateNode.setIsConnected === 'function') {
      console.log('强制更新Socket连接状态为已连接');
      stateNode.setIsConnected(true);
      return true;
    }
  }
  return false;
};

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
  const [socketClient, setSocketClient] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // 如果已经有一个连接，不要创建新的
    if (socketClient && socketClient.connected) {
      console.log('Socket已连接，跳过初始化');
      return;
    }
    
    // 防止重连过多
    if (socketClient) {
      console.log('Socket已存在但可能未连接，等待重连...');
      return;
    }
    
    // const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socketUrl = "http://8.218.148.159:3001";
    // const socketUrl = "http://localhost:3001";

    console.log("Socket客户端: 正在连接...");
    const socket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: false,
    });

    socket.on("connect", () => {
      console.log("Socket.IO已连接", socket.id);
      console.log("Socket.IO 连接状态:", socket.connected);
      console.log("Socket.IO 命名空间:", socket.nsp);
      setIsConnected(true);
      // 存储连接状态到 localStorage
      localStorage.setItem('socket_connected', 'true');
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO连接断开");
      setIsConnected(false);
      localStorage.setItem('socket_connected', 'false');
    });

    // 检查是否有存储的连接状态
    const storedConnectionState = localStorage.getItem('socket_connected');
    if (storedConnectionState === 'true' && socket.connected) {
      console.log('从localStorage恢复连接状态');
      setIsConnected(true);
    }

    socket.on("error", (error) => {
      console.error("Socket连接错误:", error);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO 连接错误:', error);
    });

    socket.on('connect_timeout', () => {
      console.error('Socket.IO 连接超时');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket.IO 重连成功，尝试次数: ${attemptNumber}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket.IO 重连错误:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket.IO 重连失败');
    });

    setSocketClient(socket);

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
    socket.on('authenticated', handleAuthenticated);
    socket.on('connected', handleConnected);

    // 初始化连接
    if (autoConnect && !socket.connected) {
      socket.connect(token);
    }

    // 检测初始连接状态
    setTimeout(() => {
      if (socket && socket.connected && !isConnected) {
        console.log("检测到Socket已连接但状态未更新，正在更新状态");
        setIsConnected(true);
      }
    }, 500);

    // 清理函数
    return () => {
      socket.off('authenticated', handleAuthenticated);
      socket.off('connected', handleConnected);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off('connect_error');
      socket.off('connect_timeout');
      socket.off('reconnect');
      socket.off('reconnect_error');
      socket.off('reconnect_failed');
    };
  }, [socketClient, token, autoConnect]);

  // 如果当前连接已经存在，立即设置为已连接状态
  useEffect(() => {
    // 只在状态不匹配时添加检查计时器
    let forceCheckTimer;
    if (socketClient && socketClient.connected && !isConnected) {
      console.log('添加一次性状态检查计时器');
      forceCheckTimer = setTimeout(() => {
        if (socketClient && socketClient.connected && !isConnected) {
          console.log('计时器检测到Socket已连接但状态未同步，强制更新');
          setIsConnected(true);
        }
      }, 2000);
    }
    
    return () => {
      if (forceCheckTimer) {
        clearTimeout(forceCheckTimer);
      }
    };
  }, [socketClient, isConnected]);

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