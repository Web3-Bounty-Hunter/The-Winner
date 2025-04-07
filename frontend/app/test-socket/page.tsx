'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../providers/socket-provider';

export default function TestSocketPage() {
  const { socketClient, isConnected, userId, playerId } = useSocket();
  const [message, setMessage] = useState('');
  const [received, setReceived] = useState<string[]>([]);

  useEffect(() => {
    if (!socketClient) return;

    // 简单的 ping 测试
    const ping = () => {
      if (isConnected) {
        console.log('发送 ping');
        socketClient.gameAction('ping', { time: Date.now() });
      }
    };

    // 监听服务器消息
    const handleMessage = (data: any) => {
      setReceived(prev => [...prev, JSON.stringify(data)]);
    };

    socketClient.on('message', handleMessage);
    
    // 定期发送 ping
    const intervalId = setInterval(ping, 10000);

    return () => {
      socketClient.off('message', handleMessage);
      clearInterval(intervalId);
    };
  }, [socketClient, isConnected]);

  const handleSendMessage = () => {
    if (socketClient && isConnected && message) {
      socketClient.sendChatMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Socket.IO 测试页面</h1>
      
      <div className="mb-4">
        <p>连接状态: {isConnected ? '已连接' : '未连接'}</p>
        <p>用户ID: {userId || '未认证'}</p>
        <p>玩家ID: {playerId || '未分配'}</p>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 mr-2"
          placeholder="输入消息"
        />
        <button 
          onClick={handleSendMessage}
          className="bg-blue-500 text-white p-2 rounded"
          disabled={!isConnected || !message}
        >
          发送消息
        </button>
      </div>
      
      <div>
        <h2 className="text-xl mb-2">收到的消息:</h2>
        <ul className="border p-2 h-60 overflow-y-auto">
          {received.map((msg, i) => (
            <li key={i} className="mb-1 border-b pb-1">{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
} 