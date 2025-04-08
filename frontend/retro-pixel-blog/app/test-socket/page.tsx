'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../providers/socket-provider';
import { useSocketRoom } from '../hooks/useSocketRoom';

export default function TestSocketPage() {
  const { socketClient, isConnected, userId, playerId } = useSocket();
  const { rooms, createRoom, joinRoom, leaveRoom } = useSocketRoom();
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
      console.log('收到消息:', data);
      setReceived(prev => [...prev, JSON.stringify(data)]);
    };

    socketClient.on('message', handleMessage);
    
    // 定期发送 ping
    const intervalId = setInterval(ping, 10000);

    return () => {
      socketClient.off('message', handleMessage);
      clearInterval(intervalId);
    };
  }, [socketClient]);

  const handleSendMessage = () => {
    if (socketClient && isConnected && message) {
      socketClient.sendChatMessage(message);
      setMessage('');
    }
  };

  const handleCreateRoom = () => {
    createRoom({
      name: `测试房间 ${Date.now()}`,
      maxPlayers: 10,
      isPrivate: false
    });
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
      
      <div className="mb-4">
        <button 
          onClick={handleCreateRoom}
          className="bg-green-500 text-white p-2 rounded mr-2"
          disabled={!isConnected}
        >
          创建房间
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">房间列表:</h2>
        <ul className="border p-2">
          {rooms.map(room => (
            <li key={room.id} className="mb-2">
              {room.name} ({room.players.length}/{room.maxPlayers})
              <button
                onClick={() => joinRoom(room.id)}
                className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
              >
                加入
              </button>
            </li>
          ))}
        </ul>
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