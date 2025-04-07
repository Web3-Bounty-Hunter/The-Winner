'use client';

import { useEffect, useState } from 'react';
import SocketClient from '../lib/socket-client';

interface InitSocketProps {
  token?: string;
  autoConnect?: boolean;
  onConnectionChange?: (connected: boolean) => void;
  onAuthenticated?: (userId: string) => void;
}

const InitSocket: React.FC<InitSocketProps> = ({
  token,
  autoConnect = true,
  onConnectionChange,
  onAuthenticated
}) => {
  const [socketClient, setSocketClient] = useState<ReturnType<typeof SocketClient> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 创建socket客户端实例
    const client = SocketClient({ autoConnect, token });
    setSocketClient(client);

    // 监听连接状态变化
    const handleConnectionChange = (data: { connected: boolean }) => {
      setIsConnected(data.connected);
      onConnectionChange?.(data.connected);
    };

    // 监听认证状态变化
    const handleAuthenticated = (data: { userId: string }) => {
      setIsAuthenticated(true);
      onAuthenticated?.(data.userId);
    };

    // 注册事件监听器
    client.on('connectionChange', handleConnectionChange);
    client.on('authenticated', handleAuthenticated);

    // 清理函数
    return () => {
      client.off('connectionChange', handleConnectionChange);
      client.off('authenticated', handleAuthenticated);
    };
  }, [token, autoConnect, onConnectionChange, onAuthenticated]);

  return null; // 这是一个纯功能组件，不渲染任何UI
};

export default InitSocket; 